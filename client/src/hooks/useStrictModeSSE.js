import { useEffect, useRef, useState, useCallback } from 'react';
import axiosInstance from '@/utils/axios';

// Global connection manager to persist across React re-mounts
const globalSSEConnections = new Map();

// Custom hook that handles React Strict Mode properly
export const useStrictModeSSE = (auctionId, onUpdate = null) => {
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [lastUpdate, setLastUpdate] = useState(null);
  const [error, setError] = useState(null);
  const onUpdateRef = useRef(onUpdate);
  const mountedRef = useRef(true);

  // Update the callback ref when it changes
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    if (!auctionId) {
      console.warn('useStrictModeSSE: No auction ID provided');
      return;
    }

    const connectionKey = auctionId;
    mountedRef.current = true;

    const updateConnectionStatus = (status) => {
      if (mountedRef.current) {
        setConnectionStatus(status);
      }
    };

    const updateError = (err) => {
      if (mountedRef.current) {
        setError(err);
      }
    };

    const updateLastUpdate = (data) => {
      if (mountedRef.current) {
        setLastUpdate(data);
        if (onUpdateRef.current && typeof onUpdateRef.current === 'function') {
          onUpdateRef.current(data);
        }
      }
    };

    // Check if we already have a connection for this auction
    let connection = globalSSEConnections.get(connectionKey);
    
    if (!connection || connection.eventSource.readyState === EventSource.CLOSED) {
      console.log('SSE: Creating new connection for auction', auctionId);
      
      const baseURL = axiosInstance.defaults.baseURL || 'http://localhost:4000';
      const sseUrl = `${baseURL}/auctions/${auctionId}/events`;
      
      const eventSource = new EventSource(sseUrl, {
        withCredentials: true,
      });

      connection = {
        eventSource,
        subscribers: new Set(),
        lastConnectTime: Date.now()
      };

      eventSource.onopen = () => {
        console.log('SSE: Connection opened for auction', auctionId);
        connection.subscribers.forEach(subscriber => {
          subscriber.updateStatus('connected');
          subscriber.updateError(null);
        });
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Handle heartbeat messages silently
          if (data.type === 'heartbeat') {
            return;
          }

          console.log('SSE: Received update for auction', auctionId, data);
          
          connection.subscribers.forEach(subscriber => {
            subscriber.updateLastUpdate(data);
          });
        } catch (parseError) {
          console.error('SSE: Error parsing message data:', parseError);
        }
      };

      eventSource.onerror = (event) => {
        console.error('SSE: Connection error for auction', auctionId);
        connection.subscribers.forEach(subscriber => {
          subscriber.updateStatus('error');
          subscriber.updateError('Connection failed');
        });
      };

      globalSSEConnections.set(connectionKey, connection);
    }

    // Subscribe this component instance
    const subscriber = {
      updateStatus: updateConnectionStatus,
      updateError: updateError,
      updateLastUpdate: updateLastUpdate
    };

    connection.subscribers.add(subscriber);
    
    // Set initial status based on connection state
    if (connection.eventSource.readyState === EventSource.OPEN) {
      updateConnectionStatus('connected');
    } else if (connection.eventSource.readyState === EventSource.CONNECTING) {
      updateConnectionStatus('connecting');
    } else {
      updateConnectionStatus('error');
    }

    console.log(`SSE: Subscribed to auction ${auctionId}. Total subscribers: ${connection.subscribers.size}`);

    // Cleanup function
    return () => {
      mountedRef.current = false;
      
      if (connection && connection.subscribers.has(subscriber)) {
        connection.subscribers.delete(subscriber);
        console.log(`SSE: Unsubscribed from auction ${auctionId}. Remaining subscribers: ${connection.subscribers.size}`);
        
        // If no more subscribers and connection is old, close it
        if (connection.subscribers.size === 0) {
          const connectionAge = Date.now() - connection.lastConnectTime;
          if (connectionAge > 5000) { // Close after 5 seconds of no subscribers
            setTimeout(() => {
              if (connection.subscribers.size === 0) {
                console.log('SSE: Closing unused connection for auction', auctionId);
                connection.eventSource.close();
                globalSSEConnections.delete(connectionKey);
              }
            }, 1000);
          }
        }
      }
    };
  }, [auctionId]);

  return {
    connectionStatus,
    lastUpdate,
    error,
    isConnected: connectionStatus === 'connected',
    isConnecting: connectionStatus === 'connecting',
    hasError: connectionStatus === 'error'
  };
};