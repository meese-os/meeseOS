/*
 * OS.js - JavaScript Cloud/Web Desktop Platform
 *
 * Copyright (c) 2011-2020, Anders Evenrud <andersevenrud@gmail.com>
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * @author  Anders Evenrud <andersevenrud@gmail.com>
 * @licence Simplified BSD License
 */
export as namespace osjs__event_emitter;

/**
 * Event Name (can be comma separated)
 */
export type EventName = string | string[];

export interface EventOptions {
  /**
   * Do not remove unless forced
   */
  persist?: boolean;

  /**
   * Fire only once
   */
  once?: boolean;
}

export interface EventInstance {
  /**
   * Event callback
   */
  callback: Function;

  /**
   * Event options
   */
  options: EventOptions;
}

export class EventEmitter {
  /**
   * EventEmitter name
   */
  name: string;

  /**
   * Map of registered events
   */
  events: Map<string, EventInstance>;

  /**
   * Constructor
   */
  constructor(name?: string);

  /**
   * Add an event handler
   */
  on(event: EventName, callback: Function, options?: EventOptions): this;

  /**
   * Adds an event handler that only fires once
   */
  once(event: EventName, callback: Function): this;

  /**
   * Removes an event handler
   */
  off(event?: EventName, callback?: Function, force?: boolean): this;

  /**
   * Emits an event
   */
  emit(event: EventName, ...args: any): this;
}
