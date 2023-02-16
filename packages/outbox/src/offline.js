import { createOffline } from "@redux-offline/redux-offline";
import offlineDefaults from "@redux-offline/redux-offline/lib/defaults/index.js";
import { RESET_STATE } from "@redux-offline/redux-offline/lib/constants.js";
import { busy } from "@redux-offline/redux-offline/lib/actions.js";

const offlineConfig = offlineDefaults.default || offlineDefaults;

export { createOffline, offlineConfig, RESET_STATE, busy };
