import { BroadcastService } from './BroadcastService';

// Global reference for development (prevents multiple instances on hot reload)
const globalForBroadcast = global as unknown as { broadcastService: BroadcastService };

export const getBroadcastService = () => {
    if (!globalForBroadcast.broadcastService) {
        globalForBroadcast.broadcastService = BroadcastService.getInstance();
    }
    return globalForBroadcast.broadcastService;
};
