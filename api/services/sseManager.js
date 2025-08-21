// SSE Manager for real-time auction updates
class SSEManager {
  constructor() {
    // Store active SSE connections by auction ID
    this.connections = new Map(); // auctionId -> Set of response objects
    this.userConnections = new Map(); // userId -> Set of auction IDs they're watching
    this.heartbeats = new Map(); // userId -> interval ID for heartbeat
  }

  // Add a new SSE connection for an auction
  addConnection(auctionId, userId, res) {
    // Initialize auction connections if not exists
    if (!this.connections.has(auctionId)) {
      this.connections.set(auctionId, new Map());
    }

    // Initialize user connections if not exists
    if (!this.userConnections.has(userId)) {
      this.userConnections.set(userId, new Set());
    }

    // Store connection with user ID as key
    this.connections.get(auctionId).set(userId, res);
    this.userConnections.get(userId).add(auctionId);

    console.log(`SSE: User ${userId} connected to auction ${auctionId}`);
    console.log(`SSE: Total connections for auction ${auctionId}: ${this.connections.get(auctionId).size}`);

    // Setup connection cleanup on close
    res.on('close', () => {
      this.removeConnection(auctionId, userId);
    });

    // Send initial connection confirmation
    this.sendToUser(auctionId, userId, {
      type: 'connected',
      message: 'Connected to auction updates',
      timestamp: new Date().toISOString()
    });

    // Setup heartbeat for this connection
    this.setupHeartbeat(auctionId, userId);
  }

  // Setup heartbeat for a connection
  setupHeartbeat(auctionId, userId) {
    // Clear existing heartbeat if any
    this.clearHeartbeat(userId);

    // Send heartbeat every 30 seconds
    const heartbeatId = setInterval(() => {
      if (this.connections.has(auctionId)) {
        this.sendToUser(auctionId, userId, {
          type: 'heartbeat',
          timestamp: new Date().toISOString()
        });
      } else {
        // Connection no longer exists, clear heartbeat
        this.clearHeartbeat(userId);
      }
    }, 30000);

    this.heartbeats.set(userId, heartbeatId);
  }

  // Clear heartbeat for a user
  clearHeartbeat(userId) {
    if (this.heartbeats.has(userId)) {
      clearInterval(this.heartbeats.get(userId));
      this.heartbeats.delete(userId);
    }
  }

  // Remove a specific user's connection
  removeConnection(auctionId, userId) {
    if (this.connections.has(auctionId)) {
      this.connections.get(auctionId).delete(userId);
      
      // Clean up empty auction groups
      if (this.connections.get(auctionId).size === 0) {
        this.connections.delete(auctionId);
      }
    }

    if (this.userConnections.has(userId)) {
      this.userConnections.get(userId).delete(auctionId);
      
      // Clean up empty user groups
      if (this.userConnections.get(userId).size === 0) {
        this.userConnections.delete(userId);
      }
    }

    // Clear heartbeat
    this.clearHeartbeat(userId);

    console.log(`SSE: User ${userId} disconnected from auction ${auctionId}`);
  }

  // Send data to a specific user
  sendToUser(auctionId, userId, data) {
    if (this.connections.has(auctionId)) {
      const res = this.connections.get(auctionId).get(userId);
      if (res && !res.destroyed) {
        try {
          res.write(`data: ${JSON.stringify(data)}\n\n`);
        } catch (error) {
          console.error(`SSE: Error sending to user ${userId}:`, error);
          this.removeConnection(auctionId, userId);
        }
      }
    }
  }

  // Broadcast data to all users watching an auction
  broadcast(auctionId, data, excludeUserId = null) {
    if (!this.connections.has(auctionId)) {
      console.log(`SSE: No connections for auction ${auctionId}`);
      return;
    }

    const auctionConnections = this.connections.get(auctionId);
    let successCount = 0;
    let failCount = 0;

    auctionConnections.forEach((res, userId) => {
      // Skip the user who triggered the event (they already know about their action)
      if (excludeUserId && userId === excludeUserId) {
        return;
      }

      if (res && !res.destroyed) {
        try {
          res.write(`data: ${JSON.stringify(data)}\n\n`);
          successCount++;
        } catch (error) {
          console.error(`SSE: Error broadcasting to user ${userId}:`, error);
          this.removeConnection(auctionId, userId);
          failCount++;
        }
      } else {
        this.removeConnection(auctionId, userId);
        failCount++;
      }
    });

    console.log(`SSE: Broadcast to auction ${auctionId} - Success: ${successCount}, Failed: ${failCount}`);
  }

  // Get connection stats
  getStats() {
    const totalConnections = Array.from(this.connections.values())
      .reduce((sum, auctionMap) => sum + auctionMap.size, 0);
    
    return {
      totalConnections,
      activeAuctions: this.connections.size,
      activeUsers: this.userConnections.size,
      auctionDetails: Array.from(this.connections.entries()).map(([auctionId, connections]) => ({
        auctionId,
        connectionCount: connections.size
      }))
    };
  }

  // Cleanup dead connections periodically
  cleanup() {
    let cleanedCount = 0;
    
    this.connections.forEach((auctionConnections, auctionId) => {
      auctionConnections.forEach((res, userId) => {
        if (res.destroyed) {
          this.removeConnection(auctionId, userId);
          cleanedCount++;
        }
      });
    });

    if (cleanedCount > 0) {
      console.log(`SSE: Cleaned up ${cleanedCount} dead connections`);
    }
  }
}

// Create singleton instance
const sseManager = new SSEManager();

// Setup periodic cleanup
setInterval(() => {
  sseManager.cleanup();
}, 60000); // Cleanup every minute

module.exports = sseManager;