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
export as namespace meeseOS__common;

import { EventEmitter } from "@aaronmeese.com/event-emitter";

export interface ServiceProviderOptions {
	before?: boolean;
	args?: object;
}

export class ServiceProvider {
	/**
	 * Core instance reference
	 */
	readonly core: CoreBase;

	/**
	 * Provider options
	 */
	readonly options: any;

	/**
	 * Constructor
	 */
	constructor(core: CoreBase, options: any);

	/**
	 * List of provided services
	 */
	provides(): string[];

	/**
	 * Initializes Provider
	 */
	init(): Promise<any>;

	/**
	 * Starts Provider
	 */
	start(): Promise<any>;

	/**
	 * Destroys Provider
	 */
	destroy(): void;
}

export class CoreBase extends EventEmitter {
	/**
	 * Logger module
	 */
	readonly logger: any;

	/**
	 * Configuration Tree
	 */
	readonly configuration: object;

	/**
	 * Options
	 */
	readonly options: object;

	/**
	 * Boot has been initiated
	 */
	booted: boolean;

	/**
	 * Fully started
	 */
	started: boolean;

	/**
	 * Fully destroyped
	 */
	destroyd: boolean;

	/**
	 * Service Provider Handler
	 */
	providers: any;

	/**
	 * Constructor
	 */
	constructor(
		defaultConfiguration: object,
		configuration: object,
		options: object
	);

	/**
	 * Destroy core instance
	 */
	destroy(): void;

	/**
	 * Boots up MeeseOS
	 */
	boot(): Promise<boolean>;

	/**
	 * Starts all core services
	 */
	start(): Promise<boolean>;

	/**
	 * Gets a configuration entry by key
	 */
	config(key: string, defaultValue: any): any;

	/**
	 * Register a service provider
	 */
	register(ref: typeof ServiceProvider, options: ServiceProviderOptions): void;

	/**
	 * Register a instanciator provider
	 */
	instance(name: string, callback: Function): void;

	/**
	 * Register a singleton provider
	 */
	singleton(name: string, callback: Function): void;

	/**
	 * Create an instance of a provided service
	 */
	make<T>(name: string, ...args: any[]): T;

	/**
	 * Check if a service exists
	 */
	has(name: string): boolean;
}
