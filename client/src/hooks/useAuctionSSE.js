import { useEffect, useRef, useState, useCallback } from 'react';
import axiosInstance from '@/utils/axios';
import { useStrictModeSSE } from './useStrictModeSSE';

// Custom hook for managing SSE connections to auction updates
export const useAuctionSSE = (auctionId, onUpdate = null) => {
  // Use the Strict Mode aware hook for better development experience
  if (import.meta.env.DEV) {
    return useStrictModeSSE(auctionId, onUpdate);
  }
  
  // Original implementation for production
  const eventSourceRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const connectingRef = useRef(false); // Prevent multiple simultaneous connections
  const lastConnectTimeRef = useRef(0); // Throttle connections in dev mode
  const isDevMode = useRef(import.meta.env.DEV); // Detect development mode
  const stableConnectionRef = useRef(false); // Track if we have a stable connection
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // 'disconnected', 'connecting', 'connected', 'error'
  const [lastUpdate, setLastUpdate] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!auctionId) {
      console.warn('useAuctionSSE: No auction ID provided');
      return;
    }

    let mounted = true;

    const connectSSE = async () => {
      // Prevent multiple simultaneous connections
      if (connectingRef.current || eventSourceRef.current?.readyState === EventSource.CONNECTING || eventSourceRef.current?.readyState === EventSource.OPEN) {
        console.log('SSE: Connection attempt blocked - already connecting/connected');
        return;
      }

      // Throttle connections (especially for React dev mode)
      const now = Date.now();
      const throttleTime = isDevMode.current ? 5000 : 2000; // Longer throttle in dev mode
      if (now - lastConnectTimeRef.current < throttleTime) {
        console.log('SSE: Connection attempt throttled');
        return;
      }

      // In dev mode, if we already have a stable connection, don't reconnect
      if (isDevMode.current && stableConnectionRef.current && eventSourceRef.current?.readyState === EventSource.OPEN) {
        console.log('SSE: Stable connection exists, skipping reconnect');
        return;
      }

      try {
        connectingRef.current = true;
        lastConnectTimeRef.current = now;
        setConnectionStatus('connecting');
        setError(null);

        // Create SSE connection (authentication will be handled via cookies)
        const baseURL = axiosInstance.defaults.baseURL || 'http://localhost:4000';
        const sseUrl = `${baseURL}/auctions/${auctionId}/events`;
        console.log('SSE: Connecting to', sseUrl);

        const eventSource = new EventSource(sseUrl, {
          withCredentials: true,
        });

        eventSourceRef.current = eventSource;

        // Connection opened
        eventSource.onopen = (event) => {
          if (mounted) {
            console.log('SSE: Connection opened for auction', auctionId);
            connectingRef.current = false;
            stableConnectionRef.current = true; // Mark as stable
            setConnectionStatus('connected');
            setError(null);
          }
        };

        // Receive messages
        eventSource.onmessage = (event) => {
          if (!mounted) return;

          try {
            const data = JSON.parse(event.data);
            
            // Handle heartbeat messages silently
            if (data.type === 'heartbeat') {
              console.log('SSE: Heartbeat received for auction', auctionId);
              return;
            }

            console.log('SSE: Received update for auction', auctionId, data);
            setLastUpdate(data);

            // Call the callback function if provided
            if (onUpdate && typeof onUpdate === 'function') {
              onUpdate(data);
            }
          } catch (parseError) {
            console.error('SSE: Error parsing message data:', parseError);
          }
        };

        // Handle errors
        eventSource.onerror = (event) => {
          if (!mounted) return;

          console.error('SSE: Connection error for auction', auctionId, event);
          
          if (eventSource.readyState === EventSource.CONNECTING) {
            console.log('SSE: Reconnecting...');
            setConnectionStatus('connecting');
          } else {
            console.log('SSE: Connection failed');
            setConnectionStatus('error');
            setError('Connection failed. Will retry...');
            
            // Clear any existing reconnect timeout
            if (reconnectTimeoutRef.current) {
              clearTimeout(reconnectTimeoutRef.current);
            }
            
            // Attempt to reconnect after a delay, but only if not already connecting
            reconnectTimeoutRef.current = setTimeout(() => {
              if (mounted && 
                  eventSourceRef.current?.readyState !== EventSource.OPEN && 
                  eventSourceRef.current?.readyState !== EventSource.CONNECTING) {
                console.log('SSE: Attempting to reconnect...');
                connectSSE();
              }
            }, 5000); // Increased delay to 5 seconds to prevent aggressive reconnection
          }
        };

      } catch (err) {
        connectingRef.current = false;
        if (mounted) {
          console.error('SSE: Failed to establish connection:', err);
          setConnectionStatus('error');
          setError(err.message);
        }
      }
    };

    // Start the connection
    connectSSE();

    // Cleanup function
    return () => {
      mounted = false;
      connectingRef.current = false;
      stableConnectionRef.current = false;
      if (eventSourceRef.current) {
        console.log('SSE: Closing connection for auction', auctionId);
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [auctionId]); // Remove onUpdate from dependencies to prevent reconnection loops

  // Manual reconnect function
  const reconnect = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setConnectionStatus('connecting');
    // The useEffect will handle the reconnection
  };

  // Disconnect function
  const disconnect = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setConnectionStatus('disconnected');
  };

  return {
    connectionStatus,
    lastUpdate,
    error,
    reconnect,
    disconnect,
    isConnected: connectionStatus === 'connected',
    isConnecting: connectionStatus === 'connecting',
    hasError: connectionStatus === 'error'
  };
};

// Hook for auction-specific updates with state management
export const useAuctionUpdates = (auctionId, initialAuction = null) => {
  const [auction, setAuction] = useState(initialAuction);
  const [recentBids, setRecentBids] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const handleSSEUpdate = useCallback((data) => {
    switch (data.type) {
      case 'connected':
        console.log('Connected to auction updates:', data.message);
        break;

      case 'bidUpdate':
        // Update auction state with new bid info
        setAuction(prev => prev ? {
          ...prev,
          current_bid: data.auction.current_bid,
          highest_bidder: data.auction.highest_bidder,
          total_bids: data.auction.total_bids
        } : null);

        // Add to recent bids list
        setRecentBids(prev => [data.bid, ...prev.slice(0, 9)]); // Keep last 10 bids

        // Add notification
        setNotifications(prev => [{
          id: Date.now(),
          type: 'bid',
          message: `New bid of ${data.bid.bid_amount} by ${data.bid.bidder_name}`,
          timestamp: data.timestamp
        }, ...prev.slice(0, 4)]); // Keep last 5 notifications
        break;

      case 'auctionEnded':
        // Update auction state
        setAuction(prev => prev ? {
          ...prev,
          status: 'ended',
          current_bid: data.final_price,
          highest_bidder: data.winner.user_id
        } : null);

        // Add notification
        const endMessage = data.reason === 'buyout' 
          ? `Auction ended by buyout! Winner: ${data.winner.name}`
          : `Auction ended! Winner: ${data.winner.name}`;
        
        setNotifications(prev => [{
          id: Date.now(),
          type: 'auction_ended',
          message: endMessage,
          timestamp: data.timestamp
        }, ...prev.slice(0, 4)]);
        break;

      default:
        console.log('SSE: Unknown update type:', data.type);
    }
  }, []); // Empty dependency array since we use functional state updates

  const sseHook = useAuctionSSE(auctionId, handleSSEUpdate);

  // Clear notifications function
  const clearNotifications = () => setNotifications([]);

  // Remove specific notification
  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return {
    ...sseHook,
    auction,
    setAuction,
    recentBids,
    notifications,
    clearNotifications,
    removeNotification
  };
};