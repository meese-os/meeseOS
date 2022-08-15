/**
 * OS.js - JavaScript Cloud/Web Desktop Platform
 *
 * Copyright (c) 2011-Present, Anders Evenrud <andersevenrud@gmail.com>
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

import { doubleTap, filteredProps } from "../utils";
import { Element } from "./Element";
import { Icon } from "./Icon";
import { h } from "hyperapp";

const tapper = doubleTap();

const createView = (props) => {
	let debounceScroll;

	const cols = (paneIndex) => (row, rowIndex) => {
		const col = row.columns[paneIndex] || {};
		const colIcon = col.icon ? h(Icon, col.icon) : null;
		const children = [
			h("span", {}, [typeof col === "object" ? col.label : col]),
		];
		const selected = props.multiselect
			? props.selectedIndex.indexOf(rowIndex) !== -1
			: props.selectedIndex === rowIndex;

		if (colIcon) {
			children.unshift(colIcon);
		}

		return h(
			"div",
			{
				key: row.key,
				"data-has-icon": col.icon ? true : undefined,
				class:
					"meeseOS-gui-list-view-cell" + (selected ? " meeseOS__active" : ""),
				ontouchstart: (ev) =>
					tapper(ev, () =>
						props.onactivate({ index: rowIndex, ev })
					),
				ondblclick: (ev) => props.onactivate({ index: rowIndex, ev }),
				onclick: (ev) => props.onselect({ index: rowIndex, ev }),
				oncontextmenu: (ev) => props.oncontextmenu({ index: rowIndex, ev }),
				oncreate: (el) => props.oncreate({ index: rowIndex, el }),
			},
			children
		);
	};

	// TODO: Allow horizontal resizing here
	// IDEA: https://stackoverflow.com/a/53220241/6456163
	// or https://stackoverflow.com/a/63195505/6456163
	// or https://stackoverflow.com/a/33523184/6456163
	const pane = (index, col) => h(
		"div",
		{
			class: "meeseOS-gui-list-view-pane",
			style: col.style || {},
		},
		[
			h(
				"div",
				{
					class: "meeseOS-gui-list-view-header",
					style: {
						display: props.hideColumns ? "none" : undefined,
					},
				},
				h("span", {}, typeof col === "object" ? col.label : col)
			),
			h(
				"div",
				{
					class: "rows",
					"data-zebra": String(props.zebra),
				},
				props.rows.map(cols(index))
			),
		]
	);

	return h(
		"div",
		{
			// TODO: Allow clicking the column name to sort by that column
			class: "meeseOS-gui-list-view-wrapper",
			onscroll: (ev) => {
				debounceScroll = clearTimeout(debounceScroll);
				debounceScroll = setTimeout(() => {
					props.onscroll(ev);
				}, 100);
			},
			oncreate: (el) => (el.scrollTop = props.scrollTop),
			onupdate: (el) => {
				const notSelected = props.multiselect
					? props.selectedIndex.length === 0
					: props.selectedIndex < 0;

				if (notSelected) {
					el.scrollTop = props.scrollTop;
				}
			},
		},
		props.columns.map((col, index) => pane(index, col))
	);
};

export const ListView = (props) => h(
	Element,
	{
		class: "meeseOS-gui-list-view",
		...props.box || {}
	},
	createView(filteredProps(props, ["box"]))
);

export const listView = {
	component: (state, actions) => {
		const createSelection = (index) => {
			if (!state.multiselect) return state.selectedIndex;

			const foundIndex = state.selectedIndex.indexOf(index);
			const newSelection = [...state.selectedIndex];
			if (foundIndex === -1) {
				newSelection.push(index);
			} else {
				newSelection.splice(foundIndex, 1);
			}

			return newSelection;
		};

		/**
		 * Creates a range of indexes from start to end.
		 * @param {Number} start
		 * @param {Number} end
		 * @returns {Array}
		 */
		const createSelectionRange = (start, end) => {
			// Swaps start and end if start is greater than end
			if (start > end) [start, end] = [end, start];

			const indices = [
				...state.selectedIndex,
				// Generates a range of indexes from start to end
				...Array.from({ length: end - start + 1 }, (_, i) => i + start)
			];

			// Remove duplicates from the array
			return [...new Set(indices)];
		};

		/**
		 * Creates an updated selection based on the user's most recent selection.
		 * 'ctrl' and 'shift' keys are used to create a range of indexes.
		 * @param {Number} index The index to add to the selection
		 * @param {Object} ev The event object
		 * @returns {Object}
		 */
		const getSelection = (index, ev) => {
			const selected = state.multiselect
				? (ev.shiftKey
					? createSelectionRange(state.previousSelectedIndex, index)
					: ev.ctrlKey
						? createSelection(index)
						: [index])
				: index;

			const data = state.multiselect
				? selected.map((item) => state.rows[item].data)
				: state.rows[selected].data;

			// Store the previous index in the state to use for calculating the
			// range if the shift key is pressed
			if (state.multiselect) actions.setPreviousSelectedIndex(index);
			return { selected, data };
		};

		const clearCurrentSelection = (index) => {
			const selected = state.multiselect ? [] : -1;

			const data = state.multiselect
				? state.selectedIndex.map((item) => state.rows[item].data)
				: state.rows[index].data;

			return { selected, data };
		};

		const newProps = {
			multiselect: false,
			zebra: true,
			columns: [],
			rows: [],
			onselect: ({ index, ev }) => {
				const { selected, data } = getSelection(index, ev);
				actions.select({ data, index, ev, selected });
				actions.setSelectedIndex(selected);
			},
			onactivate: ({ index, ev }) => {
				const { selected, data } = clearCurrentSelection(index);
				actions.activate({ data, index, ev, selected });
				actions.setSelectedIndex(selected);
			},
			oncontextmenu: ({ index, ev }) => {
				const { selected, data } = getSelection(index, ev);

				actions.select({ data, index, ev });
				actions.contextmenu({ data, index, ev, selected });
				actions.setSelectedIndex(selected);
			},
			oncreate: ({ index, el }) => {
				const data = state.rows[index].data;
				actions.created({ index, el, data });
			},
			onscroll: (ev) => {
				actions.scroll(ev);
			},
			...state
		};

		return (props = {}) => ListView(Object.assign(newProps, props));
	},

	state: (state) => ({
		selectedIndex: state.multiselect ? [] : -1,
		scrollTop: 0,
		...state
	}),

	actions: (actions) => ({
		select: () => () => ({}),
		activate: () => () => ({}),
		contextmenu: () => () => ({}),
		created: () => () => ({}),
		scroll: () => (state) => state,
		setRows: (rows) => ({ rows }),
		setColumns: (columns) => ({ columns }),
		setScrollTop: (scrollTop) => ({ scrollTop }),
		setSelectedIndex: (selectedIndex) => ({ selectedIndex }),
		setPreviousSelectedIndex: (previousSelectedIndex) => ({ previousSelectedIndex }),
		...actions || {}
	}),
};
