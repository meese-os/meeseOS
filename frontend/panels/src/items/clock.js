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

import { h } from "hyperapp";
import PanelItem from "../panel-item";
import dateformat from "dateformat";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

/** Current time string shown in the panel. */
const currentTime = () => dateformat(new Date(), "HH:MM:ss");

/** The year/month pair currently displayed by the calendar. */
const monthView = (date) => ({ year: date.getFullYear(), month: date.getMonth() });

/** Shifts a {year, month} view by a number of months. */
const shiftMonth = ({ year, month }, delta) =>
	monthView(new Date(year, month + delta, 1));

/**
 * Builds the calendar cells for a month: leading blanks for the offset of the
 * first day, then the day numbers.
 * @param {Number} year Full year
 * @param {Number} month Zero-based month
 * @returns {Array<Number|null>} Cells (null = blank pad)
 */
const buildMonthCells = (year, month) => {
	const leadingBlanks = new Date(year, month, 1).getDay();
	const daysInMonth = new Date(year, month + 1, 0).getDate();

	const cells = Array.from({ length: leadingBlanks }, () => null);
	for (let day = 1; day <= daysInMonth; day++) {
		cells.push(day);
	}

	return cells;
};

/**
 * Clock.
 *
 * @desc Clock Panel Item. Shows the time, and opens a calendar popover with the
 * full date on click (the time also exposes the full date as a hover tooltip).
 */
export default class ClockPanelItem extends PanelItem {
	init() {
		if (this.inited) return;

		const actions = super.init(
			{
				time: currentTime(),
				open: false,
				view: monthView(new Date()),
			},
			{
				increment: () => () => ({ time: currentTime() }),
				toggle: () => (state) =>
					state.open
						? { open: false }
						: { open: true, view: monthView(new Date()) },
				close: () => () => ({ open: false }),
				prevMonth: () => (state) => ({ view: shiftMonth(state.view, -1) }),
				nextMonth: () => (state) => ({ view: shiftMonth(state.view, 1) }),
			}
		);

		this.interval = setInterval(() => actions.increment(), 1000);

		// Close the calendar when clicking anywhere outside the clock item.
		this.onDocumentClick = (ev) => {
			if (!ev.target.closest(".meeseOS-panel-item[data-name=clock]")) {
				actions.close();
			}
		};
		document.addEventListener("click", this.onDocumentClick);
	}

	destroy() {
		this.interval = clearInterval(this.interval);
		if (this.onDocumentClick) {
			document.removeEventListener("click", this.onDocumentClick);
			this.onDocumentClick = null;
		}
		super.destroy();
	}

	/**
	 * Renders the calendar popover for the currently viewed month.
	 * @param {Object} state Item state
	 * @param {Object} actions Bound actions
	 * @returns {Node} A *virtual* node
	 */
	renderPopover(state, actions) {
		const today = new Date();
		const { year, month } = state.view;
		const showingThisMonth =
			year === today.getFullYear() && month === today.getMonth();

		const weekdays = WEEKDAYS.map((label) =>
			h("span", { class: "meeseOS-clock-popover-weekday" }, label)
		);

		const days = buildMonthCells(year, month).map((day) => {
			const isToday = showingThisMonth && day === today.getDate();
			return h(
				"span",
				{
					class:
						"meeseOS-clock-popover-day" + (isToday ? " meeseOS__active" : ""),
				},
				day ? String(day) : ""
			);
		});

		return h("div", { class: "meeseOS-clock-popover" }, [
			h(
				"div",
				{ class: "meeseOS-clock-popover-date" },
				dateformat(today, "dddd, mmmm d, yyyy")
			),
			h("div", { class: "meeseOS-clock-popover-nav" }, [
				h(
					"button",
					{ type: "button", onclick: () => actions.prevMonth() },
					"‹"
				),
				h("span", {}, dateformat(new Date(year, month, 1), "mmmm yyyy")),
				h(
					"button",
					{ type: "button", onclick: () => actions.nextMonth() },
					"›"
				),
			]),
			h("div", { class: "meeseOS-clock-popover-grid" }, [...weekdays, ...days]),
		]);
	}

	render(state, actions) {
		const children = [
			h(
				"span",
				{
					class: "meeseOS-clock-time",
					title: dateformat(new Date(), "dddd, mmmm d, yyyy"),
					onclick: () => actions.toggle(),
				},
				state.time
			),
		];

		if (state.open) {
			children.push(this.renderPopover(state, actions));
		}

		return super.render("clock", children);
	}
}
