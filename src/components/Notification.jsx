import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, X, Clock, ChevronRight, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Notification = ({ show, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (show) {
      fetchNotifications();
    }
  }, [show]);

 const fetchNotifications = async () => {
  try {
    setLoading(true);
    
    const token = typeof window !== 'undefined' && window.localStorage 
      ? window.localStorage.getItem("authToken") 
      : "demo-token";
      
    if (!token || token === "demo-token") {
      console.warn("⚠️ No authToken found for notifications.");
      setNotifications([]);
      return;
    }

    const response = await fetch(
      "https://santhai.kooturavu.tn.gov.in/api/v1//notifications",
      {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();
    if (!data.error && data.data) {
      // Transform API data - handle both old and new structures
      const unreadNotifications = data.data
        .filter(notification => {
          // For new structure (pc-del), check status
          if (notification.status) {
            return notification.status === "New";
          }
          // For old structure, check unread field
          return notification.unread !== false;
        })
        .map((notification, index) => {
       // Handle Stock-New notifications
if (notification.type === "Stock-New") {
  return {
    ...notification,
    id: notification.id || index,
    type: "Stock-New",
    title: notification.title || "Stock Update Request",
    message: notification.remarks || notification.message || "Stock update notification",
    unread: true,
    time: notification.time || notification.created_at || "Just now",
  };
}

// Handle pc-del type notifications
if (notification.type === "pc-del") {
  return {
    ...notification,
    id: notification.id || index,
    type: notification.type,
    title: `PC Delete Request - Indent #${notification.indent}`,
    message: `Status: ${notification.status} | Remarks: ${notification.remarks}`,
    unread: true,
    time: notification.time || notification.created_at || "Just now",
  };
}

// Handle pc-dtd type notifications
if (notification.type === "pc-dtd") {
  return {
    ...notification,
    id: notification.id || index,
    type: notification.type,
    title: `PC Deleted - Indent #${notification.indent}`,
    message: `Status: ${notification.status} | Remarks: ${notification.remarks}`,
    unread: true,
    time: notification.time || notification.created_at || "Just now",
  };
}

// Default fallback
return {
  ...notification,
  id: notification.id || index,
  type: notification.type || 'info',
  title: notification.title || 'Notification',
  message: notification.message || notification.description || '',
  unread: true,
  time: notification.time || notification.created_at || 'Just now'
};

        });
      setNotifications(unreadNotifications);
    } else {
      setNotifications([]);
    }
  } catch (err) {
    console.error("Error fetching notifications:", err);
    setNotifications([]);
  } finally {
    setLoading(false);
  }
};

const handleNotificationClick = (notification) => {
  // Mark as read API call
  markNotificationAsRead(notification.id);

  // Remove from UI immediately
  setNotifications((prev) =>
    prev.filter((n) => n.id !== notification.id)
  );

  // Close notification panel
  onClose();

  // Navigate for specific types only
  if (notification.type === "Stock-New") {
    navigate("/stock-update", { 
      state: { selectedNotification: notification, showOnlyThis: true } 
    });
 } else if (notification.type === "pc-del") {
  navigate("/delete-PC", { 
    state: { 
      indentId: notification.indent,
      remarks: notification.remarks,
      notificationId: notification.id,
    } 
  });
} else if (notification.type === "pc-dtd") {
    // ✅ Do not navigate anywhere, just mark as read
    console.log("📖 PC-DTD notification marked as read", notification);
  }
};

  const markAllAsRead = async () => {
    try {
      setLoading(true);
      const token = typeof window !== 'undefined' && window.localStorage 
        ? window.localStorage.getItem("authToken") 
        : "demo-token";
        
      if (!token || token === "demo-token") {
        console.warn("⚠️ No authToken found for mark all as read.");
        return;
      }

      const response = await fetch(
        "https://santhai.kooturavu.tn.gov.in/api/v1//notifications/read-all",
        {
          method: 'PUT',
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        // Clear all notifications from UI since they're all read now
        setNotifications([]);
      }
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type) => {
  switch (type) {
    case 'success': return '✅';
    case 'warning': return '⚠️';
    case 'error': return '❌';
    case 'Stock-New': return '📦';
    case 'Order-Update': return '🛒';
case 'pc-del': return '🗑️'; // Delete/trash icon
case 'pc-dtd': return '📄'; // Document-type icon
    default: return '🔔';
  }
};

const getNotificationColor = (type) => {
  switch (type) {
    case 'success': return 'border-l-green-400 bg-green-50';
    case 'warning': return 'border-l-yellow-400 bg-yellow-50';
    case 'error': return 'border-l-red-400 bg-red-50';
    case 'Stock-New': return 'border-l-purple-400 bg-purple-50';
    case 'Order-Update': return 'border-l-orange-400 bg-orange-50';
   case 'pc-del': return 'border-l-indigo-400 bg-indigo-50'; 
case 'pc-dtd': return 'border-l-pink-400 bg-pink-50';
    default: return 'border-l-blue-400 bg-blue-50';
  }
};

  const unreadCount = notifications.length; // All shown notifications are unread

  // 🆕 ADD THIS FUNCTION
const markNotificationAsRead = async (notificationId) => {
  try {
    const token = typeof window !== "undefined" && window.localStorage
      ? window.localStorage.getItem("authToken")
      : "demo-token";

    if (!token || token === "demo-token") {
      console.warn("⚠️ No authToken found.");
      return;
    }

    console.log(`📖 Marking notification ${notificationId} as read`);

    await fetch(
      `https://santhai.kooturavu.tn.gov.in/api/v1//notifications/${notificationId}/read`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        }
      }
    );
  } catch (err) {
    console.error("Error marking notification as read:", err);
  }
};

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Background overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ 
              type: "spring", 
              damping: 25, 
              stiffness: 300,
              duration: 0.3 
            }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                      <Bell size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">New Notifications</h2>
                      {unreadCount > 0 && (
                        <p className="text-blue-100 text-sm">
                          {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/20 rounded-xl transition-colors duration-200"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              {/* Notification list */}
              <div className="max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full"
                    />
                    <p className="text-gray-500 mt-4">Loading notifications...</p>
                  </div>
                ) : notifications.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {notifications.map((notification, idx) => (
                      <motion.div
                        key={notification.id || idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20, height: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="p-4 hover:bg-gray-50 transition-all duration-200 cursor-pointer group relative bg-blue-50/30"
                        onClick={() => handleNotificationClick(notification)}
                      >
                        {/* Unread indicator */}
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-r" />
                        
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-xl ${getNotificationColor(notification.type)} flex-shrink-0`}>
                            <span className="text-lg">
                              {getNotificationIcon(notification.type)}
                            </span>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold text-gray-900 truncate">
                                {notification.title}
                              </h3>
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 ml-2" />
                            </div>
                            
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {notification.message || `${Object.keys(notification.items || {}).length} item(s) updated`}
                            </p>
                            
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Clock size={12} />
                                {notification.time || 'Just now'}
                              </div>
                              
                              <ChevronRight 
                                size={16} 
                                className="text-gray-400 group-hover:text-gray-600 transition-colors" 
                              />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="p-4 bg-gray-100 rounded-full mb-4">
                      <Bell size={32} className="text-gray-400" />
                    </div>
                    <h3 className="font-medium text-gray-700 mb-1">No new notifications</h3>
                    <p className="text-sm text-gray-500 text-center">
                      You're all caught up! New notifications will appear here.
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="border-t bg-gray-50 p-4">
                  <div className="flex items-center justify-between">
                    <button 
                      onClick={markAllAsRead}
                      disabled={loading}
                      className={`text-sm font-medium transition-colors ${
                        !loading
                          ? 'text-blue-600 hover:text-blue-700 cursor-pointer' 
                          : 'text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {loading ? 'Marking all as read...' : 'Mark all as read'}
                    </button>
                    <span className="text-sm text-gray-500">
                      Click any notification to view details
                    </span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default Notification;