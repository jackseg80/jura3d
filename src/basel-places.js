import {createPointPlacesLayer} from './point-places.js';
import {loadBaselPlaces} from './basel-places-data.js';
export function createBaselPlacesLayer(viewer, options) {
  return createPointPlacesLayer(viewer,{...options,loadRecords:loadBaselPlaces});
}
