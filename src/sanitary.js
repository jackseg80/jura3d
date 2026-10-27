import {createPointPlacesLayer} from './point-places.js';
import {loadSanitary} from './sanitary-data.js';
export function createSanitaryLayer(viewer, options) {
  return createPointPlacesLayer(viewer,{...options,prefix:'services',symbol:'WC',label:'Services',loadRecords:loadSanitary,
    extraControls:['#services-eurokey'],filterRecord:record=>{
      const value=document.querySelector('#services-eurokey').value;
      return !value || (value==='yes'&&record.display.eurokey===true) || (value==='no'&&record.display.eurokey===false) || (value==='unknown'&&record.display.eurokey===null);
    }});
}
