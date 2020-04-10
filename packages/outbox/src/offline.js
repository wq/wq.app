import { RESET_STATE } from '@redux-offline/redux-offline/lib/constants';
import { busy } from '@redux-offline/redux-offline/lib/actions';

import detectNetwork from '@redux-offline/redux-offline/lib/defaults/detectNetwork';
import retry from '@redux-offline/redux-offline/lib/defaults/retry';
import discard from '@redux-offline/redux-offline/lib/defaults/discard';
import defaultCommit from '@redux-offline/redux-offline/lib/defaults/defaultCommit';
import defaultRollback from '@redux-offline/redux-offline/lib/defaults/defaultRollback';
import offlineStateLens from '@redux-offline/redux-offline/lib/defaults/offlineStateLens';

const createOffline = require('../vendor/redux-offline').createOffline;

// Simulate default config but skip importing unused items
const offlineConfig = {
    rehydrate: true,
    // persist,
    detectNetwork,
    // effect,
    retry,
    discard,
    defaultCommit,
    defaultRollback,
    // persistAutoRehydrate,
    offlineStateLens,
    // queue,
    returnPromises: false
};

export { createOffline, offlineConfig, RESET_STATE, busy };
