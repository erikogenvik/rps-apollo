import React, { Component } from "react";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import HomePage from "../pages/HomePage";
import { WebSocketLink } from "apollo-link-ws";
import ApolloClient from "apollo-client/ApolloClient";
import { ApolloLink } from "apollo-link";
import { onError } from "apollo-link-error";
import { InMemoryCache } from "apollo-cache-inmemory";
import { ApolloProvider } from "react-apollo";



const wsLink = new WebSocketLink({
  uri: process.env.REACT_APP_WS_URI,
  options: {
    reconnect: true
  }
});

const client = new ApolloClient({
  link: ApolloLink.from([
    onError(({ graphQLErrors, networkError }) => {
      if (graphQLErrors)
        graphQLErrors.map(({ message, locations, path }) =>
          console.log(
            `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
          )
        );
      if (networkError) console.log(`[Network error]: ${networkError}`);
    }),
    wsLink
  ]),
  cache: new InMemoryCache()
});

export default class MainRouter extends Component {


  render() {
    return (
      <BrowserRouter>
        <ApolloProvider client={client}>
            <Switch>
              <Route exact path="/" component={HomePage} />
            </Switch>
          </ApolloProvider>
      </BrowserRouter>
    );
  }
}
