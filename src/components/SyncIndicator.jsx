import { useOffline } from '../contexts';

const SyncIndicator = () => {
  const { isOnline, pendingSyncCount, syncInProgress, lastSyncTime } = useOffline();

  if (isOnline && pendingSyncCount === 0 && !syncInProgress) {
    return null;
  }

  return (
    <div className={`text-center py-2 px-4 text-sm font-medium ${
      !isOnline
        ? 'bg-warning-500 text-white'
        : syncInProgress
        ? 'bg-info-500 text-white'
        : 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
    }`}>
      {!isOnline && '📱 Offline - Data will sync when connection is restored'}
      {isOnline && syncInProgress && '🔄 Syncing...'}
      {isOnline && !syncInProgress && pendingSyncCount > 0 && (
        <span>📤 {pendingSyncCount} order(s) pending sync</span>
      )}
    </div>
  );
};

export default SyncIndicator;
