import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import reportWebVitals from "./reportWebVitals";

import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";

// import 'bootstrap/dist/css/bootstrap.min.css';
import 'rsuite/dist/styles/rsuite-default.css';

// Redux
import { Provider } from "react-redux";
import { store } from "./redux/store";

const baseUrl = document.getElementsByTagName('base')[0].getAttribute('href');

ReactDOM.render(
  <Provider store={store}>
      <HelmetProvider>
        <BrowserRouter basename={baseUrl}>
          <App />
        </BrowserRouter>
      </HelmetProvider>
  </Provider>,
  document.getElementById("root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
