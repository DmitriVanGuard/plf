module.exports = {
	"extends": [
		"airbnb-base",
		"prettier"
		],
	"plugins": [
		"prettier"
	],
	"parser": "babel-eslint",
	"parserOptions":{
		"ecmaVersion": 2016,
		"sourceType": "module"
	},
	"env": {
		"es6": true, //Not change global var-ls like that exist in es6?
		"browser": true, // -//- window, document
		"node": true, //process.env
	}
};
