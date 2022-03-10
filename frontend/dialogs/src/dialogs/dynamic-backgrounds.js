import {
	Box,
	BoxContainer,
	SelectField,
	TextField,
} from "@aaronmeese.com/gui";
import {
	componentToHex,
	colorFromClick,
	createPalette,
	hexToComponent,
	rangeContainer,
} from "../color-utils";
import { app, h } from "hyperapp";
import Dialog from "../dialog";

/**
 * Default MeeseOS Dynamic Backgrounds Dialog
 */
export default class DynamicBackgroundsDialog extends Dialog {
	/**
	 * Constructor
	 * @param {Core} core MeeseOS Core reference
	 * @param {Object} args Arguments given from service creation
	 * @param {String} [args.title] Dialog title
	 * @param {Function} callback The callback function
	 */
	constructor(core, args, callback) {
		super(
			core,
			args,
			{
				className: "dynamicBackgrounds",
				buttons: ["ok", "cancel"],
				window: {
					title: args.title || "Dynamic Backgrounds",
					attributes: {
						minDimension: {
							width: 200,
							height: 100,
						},
					},
				},
			},
			callback
		);

		// IDEA: Make deep copy of args so we can modify `this`
		// and eliminate the need for `state`, then translate over
		// to all the other dialogs.
		this.settings = args.choices;
		this.selectedIndex = 0;

		// This is what is returned from the dialog
		this.value = this.settings[this.selectedIndex];

		// TODO: Store copy of original colors, so we can revert if user cancels
		// TODO: Close dialog if the widget is deleted
		// TODO: See if I can eliminate the need for state, or `this`
	}

	render(options) {
		super.render(options, ($content) => {
			const initialState = Object.assign({}, this);
			const initialActions = {
				setColor: (newHex) => (state) =>
					(this.value[this.selectedChoice] = state.value[state.selectedChoice] =
						newHex),
				setColors: (colors) => (state) => (this.value = state.value = colors),
				setSelectedChoice: (color) => (state) =>
					(this.selectedChoice = state.selectedChoice = color),
				// color -> r, g, or b; newValue -> 0-255
				setComponent:
					({ color, newValue }) =>
					(state) => {
						const previousHex = this.value[this.selectedChoice];
						const previousComponent = hexToComponent(previousHex);
						const newComponent = {
							...previousComponent,
							[color]: newValue,
						};

						const newHex = componentToHex(newComponent);
						this.value[this.selectedChoice] = state.value[state.selectedChoice] =
							newHex;

						return { [color]: newValue };
					},
			};

			/**
			 * Iterates over the properties of the `setting` object and renders
			 * a relevant element based on the type.
			 * @param {Object} setting
			 */
			const createSetting = (setting) => {
				switch (setting.type) {
					case "color":
						return colorElement();
					case "number":
						//
						break;
					case "boolean":
						//
						break;
					default:
						//
						break;
				}
			}

			/**
			 * Renders a color element
			 * @private
			 * @returns TODO: typedef
			 */
			const colorElement = () =>
				h(Box, { orientation: "vertical", grow: 1, shrink: 1 }, [
					h(BoxContainer, { orientation: "horizontal" }, [
						h("div", {
							class: "meeseOS-gui-border",
							style: { display: "inline-block" },
							oncreate: (el) => {
								const canvas = createPalette(98, 98);
								canvas.addEventListener("click", (ev) => {
									const newColor = colorFromClick(ev, canvas);
									const newHex = newColor.hex;
									// TODO
									a.setColor(newHex);
								});

								el.appendChild(canvas)
							},
						}),
						h(TextField, {
							// TODO
							value: state.value[state.selectedChoice],
							style: {
								width: "100px",
								color: state.value[state.selectedChoice],
							},
						}),
					]),
					h(Box, { padding: false, grow: 1, shrink: 1 }, [
						// Creates a rangeContainer element for each color component
						["r", "g", "b"].map((color) =>
							rangeContainer(
								color,
								hexToComponent(state.value[state.selectedChoice])[color],
								actions
							)
						)
					]),
				]);

			// Initial rendered content
			const a = app(
				initialState,
				initialActions,
				// actions -> the functions listed above the class
				// state -> `this` from the class
				(state, actions) =>
					this.createView([
						h(Box, { orientation: "vertical", grow: 1, shrink: 1 }, [
							h(SelectField, {
								choices: Object.keys(state.value),
								value: state.settings[state.selectedIndex],
								oncreate: (el) =>
									(el.value = state.settings[state.selectedIndex]),
								onchange: (event, newColor) => {
									actions.setSelectedChoice(newColor);
								},
							}),
							h(BoxContainer, { orientation: "horizontal" }, [
								// TODO: Add elements here
							]),
						]),
					]), $content
			);
		});
	}
}
