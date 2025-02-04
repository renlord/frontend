import * as types from "@/store/mutation-types";
import * as api from "@/api";
import config from "@/config";
import { isIsoDate } from "@/util";

/** @typedef {import("./types").QueryParams} QueryParams */
/** @typedef {import("./types").User} User */
/** @typedef {import("./types").Device} Device */

/**
 * Populate the state from URL query parameters.
 *
 * @param {QueryParams} query URL query parameters
 */
const populateStateFromQuery = ({ state, commit }, query) => {
  if (query.lat && !isNaN(parseFloat(query.lat))) {
    commit(types.SET_MAP_CENTER, {
      lat: query.lat,
      lng: parseFloat(state.map.center.lng),
    });
  }
  if (query.lng && !isNaN(parseFloat(query.lng))) {
    commit(types.SET_MAP_CENTER, {
      lat: parseFloat(state.map.center.lat),
      lng: query.lng,
    });
  }
  if (query.zoom && !isNaN(parseInt(query.zoom))) {
    commit(types.SET_MAP_ZOOM, parseInt(query.zoom));
  }
  if (query.start && isIsoDate(query.start)) {
    commit(types.SET_START_DATE, new Date(query.start));
  }
  if (query.end && isIsoDate(query.end)) {
    commit(types.SET_END_DATE, new Date(query.end));
  }
  if (query.user) {
    commit(types.SET_SELECTED_USER, query.user);
  }
  if (query.device) {
    commit(types.SET_SELECTED_DEVICE, query.device);
  }
  if (query.layers) {
    const activeLayers = query.layers.split(",");
    Object.keys(state.map.layers).forEach(layer => {
      const visibility = activeLayers.includes(layer);
      if (state.map.layers[layer] !== visibility) {
        commit(types.SET_MAP_LAYER_VISIBILITY, { layer, visibility });
      }
    });
  }
};

/**
 * Trigger loading of all required data: users, devices, last locations,
 * location history, version and initiate WebSocket connection.
 */
const loadData = async ({ dispatch }) => {
  await dispatch("getUsers");
  await dispatch("getDevices");
  await dispatch("getLastLocations");
  await dispatch("getLocationHistory");
  await dispatch("getRecorderVersion");
  await dispatch("connectWebsocket");
};

/**
 * Reload last locations and location history. Will be called when
 * start date, end date, selected user or selected device changes.
 */
const reloadData = async ({ dispatch }) => {
  await dispatch("getLastLocations");
  await dispatch("getLocationHistory");
};

/**
 * Connect to WebSocket to receive live location updates. When an update is
 * received, reload last locations and location history depending on config.
 */
const connectWebsocket = async ({ dispatch }) => {
  api.connectWebsocket(async () => {
    // TODO: keep cards from HTTP API response in the Vuex store so we
    // can use the data from the WebSocket location update (which does
    // not contain card information) and don't have to poll the API.
    await dispatch("getLastLocations");
    if (config.onLocationChange.reloadHistory) {
      await dispatch("getLocationHistory");
    }
  });
};

/**
 * Load user names.
 */
const getUsers = async ({ commit }) => {
  commit(types.SET_USERS, await api.getUsers());
};

/**
 * Load devices names of all users.
 */
const getDevices = async ({ commit, state }) => {
  commit(types.SET_DEVICES, await api.getDevices(state.users));
};

/**
 * Load last location of the selected user/device.
 */
const getLastLocations = async ({ commit, state }) => {
  let lastLocations = await api.getLastLocations(
    state.selectedUser,
    state.selectedDevice
  );
  if (config.ignorePingLocation) {
    // Remove ping/ping from the owntracks/recorder Docker image
    // https://github.com/owntracks/frontend/issues/12
    lastLocations = lastLocations.filter(
      l => !(l.username === "ping" && l.device === "ping")
    );
  }
  commit(types.SET_LAST_LOCATIONS, lastLocations);
};

/**
 * Load location history of all devices, in the selected date range.
 */
const getLocationHistory = async ({ commit, state }) => {
  commit(types.SET_IS_LOADING, true);
  let devices;
  if (state.selectedUser) {
    if (state.selectedDevice) {
      devices = { [state.selectedUser]: [state.selectedDevice] };
    } else {
      devices = { [state.selectedUser]: state.devices[state.selectedUser] };
    }
  } else {
    devices = state.devices;
  }
  commit(
    types.SET_LOCATION_HISTORY,
    await api.getLocationHistory(devices, state.startDate, state.endDate)
  );
  commit(types.SET_IS_LOADING, false);
};

/**
 * Load the OwnTracks recorder version.
 */
const getRecorderVersion = async ({ commit }) => {
  commit(types.SET_RECORDER_VERSION, await api.getVersion());
};

/**
 * Set the selected user and reload the location history.
 *
 * @param {User} user Name of the new selected user
 */
const setSelectedUser = async ({ commit, dispatch }, user) => {
  commit(types.SET_SELECTED_DEVICE, null);
  commit(types.SET_SELECTED_USER, user);
  await dispatch("reloadData");
};

/**
 * Set the selected device and reload the location history.
 *
 * @param {Device} device Name of the new selected device
 */
const setSelectedDevice = async ({ commit, dispatch }, device) => {
  commit(types.SET_SELECTED_DEVICE, device);
  await dispatch("reloadData");
};

/**
 * Set the start date for loading data and reload the location history.
 *
 * @param {Date} startDate Start date for loading data
 */
const setStartDate = async ({ commit, dispatch }, startDate) => {
  commit(types.SET_START_DATE, startDate);
  await dispatch("reloadData");
};

/**
 * Set the end date for loading data and reload the location history.
 *
 * @param {Date} endDate End date for loading data
 */
const setEndDate = async ({ commit, dispatch }, endDate) => {
  commit(types.SET_END_DATE, endDate);
  await dispatch("reloadData");
};

export default {
  populateStateFromQuery,
  loadData,
  reloadData,
  connectWebsocket,
  getUsers,
  getDevices,
  getLastLocations,
  getLocationHistory,
  getRecorderVersion,
  setSelectedUser,
  setSelectedDevice,
  setStartDate,
  setEndDate,
};
