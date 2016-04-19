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
import Modal from './modal';

export const modals = [];

/**
 * Check to see if one or more triggers for the current mdoal exists on the
 * page using data attributes. If so, bind the opening of the modal to this
 * button via a click event.
 * @param {string} name A unique name for the modal.
 * @param {Modal} modal The modal instance.
 */
function setupTrigger_(name, modal) {
  const $trigger = $('[data-modal-trigger=' + name + ']');
  if ($trigger) {
    $trigger.on('click', e => {
      e.preventDefault();
      modal.open();
    });
  }
}

/**
 * Registers a new modal via its content element. Must have a data-modal
 * attribute with a unique modal name.
 * @param {jQuery} $element The modal jQuery element.
 */
export function add($element) {
  const name = $element.data('modal');
  const modal = new Modal(name, $element);
  modals.push(modal);
  setupTrigger_(name, modal);
}

/**
 * Retrieves a modal from the registry via its name.
 * @param {string} name The modal's name.
 * @return {Modal} The modal instance.
 */
export function get(name) {
  return modals.filter(modal => {
    return modal.name === name;
  })[0];
}

/**
 * Initialise modal registration. Looks throughout the current page for any
 * elements that have data-modal attributes attached to them and adds each of
 * these to the registry.
 */
export function init() {
  const $modals = $('[data-modal]');
  $modals.each(function() {
    add($(this));
  });
}
