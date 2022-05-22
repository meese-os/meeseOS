/* eslint-disable */

import { DomAnimator } from "./utils/dom-animator.js";
const domAnimator = new DomAnimator();

// Awesome monkeys from http://www.geocities.ws/SoHo/7373/zoo.html

const frame1 = ['       .-"-.       ',
                '     _/.-.-.\\_     ',
                '    ( ( o o ) )    ',
                '     |/  "  \\|     ',
                "      \\'/^\\'/      ",
                '      /`\\ /`\\      ',
                '     /  /|\\  \\     ',
                '    ( (/ T \\) )    ',
                '     \\__/^\\__/     '];

const frame2 = ['       .-"-.       ',
                '     _/_-.-_\\_     ',
                '    / __> <__ \\    ',
                '   / //  "  \\\\ \\   ',
                "  / / \\'---'/ \\ \\  ",
                '  \\ \\_/`"""`\\_/ /  ',
                '   \\           /   ',
                '    \\         /    ',
                '     |   .   |     '];

const frame3 = ['       .-"-.       ',
                '     _/_-.-_\\_     ',
                '    /|( o o )|\\    ',
                '   | //  "  \\\\ |   ',
                "  / / \\'---'/ \\ \\  ",
                '  \\ \\_/`"""`\\_/ /  ',
                '   \\           /   ',
                '    \\         /    ',
                '     |   .   |     '];

domAnimator.addFrame(frame1);
domAnimator.addFrame(frame2);
domAnimator.addFrame(frame3);
domAnimator.animate(1000);
