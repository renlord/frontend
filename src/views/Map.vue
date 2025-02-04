<template>
  <LMap
    ref="map"
    :center="map.center"
    :zoom="map.zoom"
    :options="{ zoomControl: false }"
    @update:center="setMapCenter"
    @update:zoom="setMapZoom"
  >
    <LControlZoom
      v-if="controls.zoom.display"
      :position="controls.zoom.position"
    />
    <LControlScale
      v-if="controls.scale.display"
      :position="controls.scale.position"
      :maxWidth="controls.scale.maxWidth"
      :metric="controls.scale.metric"
      :imperial="controls.scale.imperial"
    />
    <LTileLayer
      :url="url"
      :attribution="attribution"
      :options="{ maxNativeZoom, maxZoom }"
    />

    <template v-if="map.layers.last">
      <LCircle
        v-for="l in lastLocations"
        :key="`${l.topic}-circle`"
        :lat-lng="[l.lat, l.lon]"
        :radius="l.acc"
        v-bind="circle"
      />

      <LMarker
        v-for="l in lastLocations"
        :key="`${l.topic}-marker`"
        :lat-lng="[l.lat, l.lon]"
      >
        <LDeviceLocationPopup
          :user="l.username"
          :device="l.device"
          :name="l.name"
          :face="l.face"
          :timestamp="l.tst"
          :lat="l.lat"
          :lon="l.lon"
          :alt="l.alt"
          :battery="l.batt"
          :speed="l.vel"
        />
      </LMarker>
    </template>

    <template v-if="map.layers.line">
      <LPolyline
        v-for="(group, i) in locationHistoryLatLngGroups"
        :key="i"
        :lat-lngs="group"
        v-bind="polyline"
      />
    </template>

    <template v-if="map.layers.points">
      <template v-for="(userDevices, user) in locationHistory">
        <template v-for="(deviceLocations, device) in userDevices">
          <LCircleMarker
            v-for="(l, n) in deviceLocations"
            :key="`${user}-${device}-${n}`"
            :lat-lng="[l.lat, l.lon]"
            v-bind="circleMarker"
          >
            <LDeviceLocationPopup
              :user="user"
              :device="device"
              :timestamp="l.tst"
              :lat="l.lat"
              :lon="l.lon"
              :alt="l.alt"
              :battery="l.batt"
              :speed="l.vel"
            ></LDeviceLocationPopup>
          </LCircleMarker>
        </template>
      </template>
    </template>

    <template v-if="map.layers.heatmap">
      <LHeatmap
        v-if="locationHistoryLatLngs.length"
        :lat-lng="locationHistoryLatLngs"
        :max="heatmap.max"
        :radius="heatmap.radius"
        :blur="heatmap.blur"
        :gradient="heatmap.gradient"
      />
    </template>
  </LMap>
</template>

<script>
import { mapGetters, mapState, mapMutations } from "vuex";
import L from "leaflet";
import {
  LMap,
  LTileLayer,
  LControlScale,
  LControlZoom,
  LMarker,
  LCircleMarker,
  LCircle,
  LPolyline,
} from "vue2-leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

import * as types from "@/store/mutation-types";
import config from "@/config";
import LHeatmap from "@/components/LHeatmap";
import LDeviceLocationPopup from "@/components/LDeviceLocationPopup";

// See https://github.com/KoRiGaN/Vue2Leaflet/issues/28#issuecomment-299038157
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

export default {
  components: {
    LMap,
    LTileLayer,
    LControlScale,
    LControlZoom,
    LMarker,
    LCircleMarker,
    LCircle,
    LPolyline,
    LDeviceLocationPopup,
    LHeatmap,
  },
  data() {
    return {
      attribution: config.map.attribution,
      center: this.$store.state.map.center,
      controls: config.map.controls,
      heatmap: config.map.heatmap,
      maxZoom: config.map.maxZoom,
      maxNativeZoom: config.map.maxNativeZoom,
      url: config.map.url,
      zoom: this.$store.state.map.zoom,
      circle: {
        ...config.map.circle,
        color: config.map.circle.color || config.primaryColor,
        fillColor: config.map.circle.fillColor || config.primaryColor,
      },
      circleMarker: {
        ...config.map.circleMarker,
        color: config.map.circleMarker.color || config.primaryColor,
      },
      polyline: {
        ...config.map.polyline,
        color: config.map.polyline.color || config.primaryColor,
      },
    };
  },
  mounted() {
    this.$root.$on("fitView", () => {
      this.fitView();
    });
  },
  computed: {
    ...mapGetters(["locationHistoryLatLngs", "locationHistoryLatLngGroups"]),
    ...mapState(["lastLocations", "locationHistory", "map"]),
  },
  methods: {
    ...mapMutations({
      setMapCenter: types.SET_MAP_CENTER,
      setMapZoom: types.SET_MAP_ZOOM,
    }),
    /**
     * Fit all objects on the map into view.
     */
    fitView() {
      if (
        (this.map.layers.line ||
          this.map.layers.points ||
          this.map.layers.heatmap) &&
        this.locationHistoryLatLngs.length > 0
      ) {
        this.$refs.map.mapObject.fitBounds(
          new L.LatLngBounds(this.locationHistoryLatLngs)
        );
      } else if (this.map.layers.last && this.lastLocations.length > 0) {
        const locations = this.lastLocations.map(l => L.latLng(l.lat, l.lon));
        this.$refs.map.mapObject.fitBounds(new L.LatLngBounds(locations), {
          maxZoom: this.maxNativeZoom,
        });
      }
    },
  },
};
</script>
