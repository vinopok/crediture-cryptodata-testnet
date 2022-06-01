import React from "react";
import './App.css';
import SimpleStorage from './SimpleStorage';
class App extends React.Component {

	// Constructor
	constructor(props) {
		super(props);
	}

	render() {
		return (
			<div>
				<div className="App">
					<SimpleStorage/>
				</div>
			</div>
		);
    }
}

export default App;
