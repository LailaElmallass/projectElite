/** @type {import('tailwindcss').Config} */
export default {
	darkMode: ['class'],
	content: ['./src/**/*.{js,jsx,ts,tsx}'],
	theme: {
	  extend: {
		colors: {
		  'elite-yellow': {
			50: '#fffef0',
			100: '#fffcdb',
			200: '#fff6a8',
			300: '#ffee70',
			400: '#ffe042',
			500: '#ffd926',
			600: '#e6c000',
			700: '#cca200',
			800: '#a27d00',
			900: '#856800',
		  },
		  'elite-red': {
			50: '#fff0f0',
			100: '#ffdddd',
			200: '#ffc2c2',
			300: '#ff9999',
			400: '#ff6666',
			500: '#ff3333',
			600: '#ff0000',
			700: '#bd1414',
			800: '#b80000',
			900: '#990000',
		  },
		  'elite-black': {
			50: '#f2f2f2',
			100: '#e6e6e6',
			200: '#cccccc',
			300: '#b3b3b3',
			400: '#999999',
			500: '#808080',
			600: '#666666',
			700: '#4d4d4d',
			800: '#333333',
			900: '#1a1a1a',
		  },
		},
	  },
	},
	plugins: [require('tailwindcss-animate')],
  };
  