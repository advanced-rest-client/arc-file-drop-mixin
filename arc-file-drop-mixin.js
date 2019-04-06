/**
@license
Copyright 2018 The Advanced REST client authors <arc@mulesoft.com>
Licensed under the Apache License, Version 2.0 (the "License"); you may not
use this file except in compliance with the License. You may obtain a copy of
the License at
http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
License for the specific language governing permissions and limitations under
the License.
*/
import {dedupingMixin} from '../../@polymer/polymer/lib/utils/mixin.js';
/**
 * A mixin with common function used to drag and drop file import.
 *
 * Contains methods to enable UI to react on drop events.
 *
 * @polymer
 * @mixinFunction
 * @memberof ArcComponents
 */
export const ArcFileDropMixin = dedupingMixin((base) => {
  /**
   * @polymer
   * @mixinClass
   */
  class ArcFileDropMixinImpl extends base {
    constructor() {
      super();
      this._onDragEnter = this._onDragEnter.bind(this);
      this._onDragLeave = this._onDragLeave.bind(this);
      this._onDragOver = this._onDragOver.bind(this);
      this._onDrop = this._onDrop.bind(this);
    }

    connectedCallback() {
      super.connectedCallback();
      this.addEventListener('dragenter', this._onDragEnter);
      this.addEventListener('dragleave', this._onDragLeave);
      this.addEventListener('dragover', this._onDragOver);
      this.addEventListener('drop', this._onDrop);
    }

    static get properties() {
      return {
        /**
         * True when file is dragged over the element.
         */
        dragging: {
          type: Boolean,
          readOnly: true,
          reflectToAttribute: true
        }
      };
    }

    _onDragEnter(e) {
      const types = e.dataTransfer.types;
      if (types.indexOf('Files') === -1) {
        return;
      }
      this._cancelEvent(e);
      this._setDragging(true);
    }

    _onDragLeave(e) {
      const types = e.dataTransfer.types;
      if (types.indexOf('Files') === -1) {
        return;
      }
      this._cancelEvent(e);
      this._setDragging(false);
    }

    _onDragOver(e) {
      const types = e.dataTransfer.types;
      if (types.indexOf('Files') === -1) {
        return;
      }
      this._cancelEvent(e);
    }

    _onDrop(e) {
      const types = e.dataTransfer.types;
      if (types.indexOf('Files') === -1) {
        return;
      }
      this._cancelEvent(e);
      this._setDragging(false);
      const files = e.dataTransfer.files;
      if (!files || !files.length) {
        return;
      }
      this._processEntries(files);
    }

    _cancelEvent(e) {
      e.stopPropagation();
      e.preventDefault();
    }
    /**
     * Dispatches `api-process-file` if the file is of a type of
     * `application/zip` or `application/yaml`. Dispatches `import-process-file`
     * event in other cases.
     *
     * When handling json file it reads the file and checks if file is
     * OAS/swagger file.
     *
     * @param {FileList} files Dropped files list
     * @return {Promise}
     */
    _processEntries(files) {
      const file = files[0];
      const apiTypes = [
        'application/zip', 'application/yaml', 'application/x-yaml',
        'application/raml', 'application/x-raml'
      ];
      if (apiTypes.indexOf(file.type) !== -1) {
        // probably API file
        return this._notifyApiParser(file);
      }
      const e = this._fire('import-process-file', {
        file
      });
      if (!e.detail.result) {
        const msg = 'Import intent not handled by the application';
        this._fire('process-error', {
          message: msg
        });
        return Promise.reject(new Error(msg));
      }
      return e.detail.result.catch((cause) => {
        let message;
        if (typeof cause === 'string') {
          message = cause;
        } else {
          message = cause.message;
        }
        this._fire('process-error', {
          message
        });
      });
    }
    /**
     * Dispatches `api-process-file` to parse API data.
     * @param {File} file User file.
     * @return {Promise}
     */
    _notifyApiParser(file) {
      const e = this._fire('api-process-file', {
        file
      });
      if (!e.defaultPrevented) {
        const msg = 'API processor not available';
        this._fire('process-error', {
          message: msg
        });
        return Promise.reject(new Error(msg));
      }
      return e.detail.result
      .then((result) => {
        this._fire('api-data-ready', result);
      });
    }
    /**
     * Dispatches custom event and returns it.
     * @param {String} type Event type
     * @param {Object} detail Event detail object
     * @return {CustomEvent}
     */
    _fire(type, detail) {
      const e = new CustomEvent(type, {
        bubbles: true,
        composed: true,
        cancelable: true,
        detail
      });
      this.dispatchEvent(e);
      return e;
    }
  }
  return ArcFileDropMixinImpl;
});
