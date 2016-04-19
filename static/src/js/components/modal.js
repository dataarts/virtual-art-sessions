/**
 * Copyright 2016 Google Inc. All Rights Reserved.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import $ from 'jquery';
import * as Signal from '../viewer/app/signal';
import * as youtube from './youtube';

const classes = {
  BEFORE_VISIBLE: 'before-visible',
  MODAL_OPEN: 'modal-open',
  IS_VISIBLE: 'is-visible'
};

class Modal {
  /**
   * Create a modal.
   * @param {string} name A unique name given to the modal.
   * @param {jQuery} $element The modal jQuery element.
   */
  constructor(name, $element) {
    this.name = name;
    this.$element = $element;
    this.$close = this.$element.find('[data-modal-close]');
    this.events = {
      onOpen: Signal.create(),
      onClose: Signal.create()
    };
    this.isOpen = false;
    this.state = {
      players: {},
    };
  }

  /**
   * Bind event listeners for closing the current modal. Adds a click listener
   * to the close button and allows closing via the esc key.
   */
  bindEvents_() {
    $(document).on('keyup', e => {
      const code = e.keyCode || e.which;
      if (code === 27) {
        this.close();
      }
    });

    if (this.$close) {
      this.$close.on('click.modal', e => {
        e.preventDefault();
        this.close();
      });
    }
    youtube.open(this);
  }

  /**
   * Unbinds click and keypress close events when modal is closed.
   */
  unbindEvents_() {
    $(document).off('keyup');
    if (this.$close) {
      this.$close.off('click.modal');
    }
    youtube.close(this);
  }

  /**
   * Open the current modal. Adds helper classes to the modal's element and
   * emits an open modal event.
   */
  open() {
    if (!this.isOpen) {
      this.$element.addClass(classes.BEFORE_VISIBLE);
      this.$element[0].clientWidth;
      this.$element.addClass(classes.IS_VISIBLE);
      $(document.body).addClass(classes.MODAL_OPEN);
      this.isOpen = true;
      this.bindEvents_();
      this.events.onOpen.emit(this);
    }
  }

  /**
   * Close the current modal. Removes classes and unbinds events. Emits a close
   * modal event.
   */
  close() {
    if (this.isOpen) {
      this.$element.removeClass(classes.BEFORE_VISIBLE);
      this.$element.removeClass(classes.IS_VISIBLE);
      $(document.body).removeClass(classes.MODAL_OPEN);
      this.isOpen = false;
      this.unbindEvents_();
      this.events.onClose.emit(this);
    }
  }
};

export default Modal;
