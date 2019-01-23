import React, { Component } from 'react';
import { Query, Mutation, Subscription } from 'react-apollo';
import gql from 'graphql-tag';

const MAKE_MOVE = gql`
      mutation M($playerId: String!, $move: MoveType!) {
        makeMove(playerId: $playerId, move: $move) 
      }
    `;

const WINNERS_QUERY = gql`
      query Q {
        winners
      }
    `;

const GAME_ENDED_SUBSCRIPTION = gql`
  subscription {
    gameEnded {
      player1Id
      player2Id
      player1Move
      player2Move
      winner
    }
  }
`;

const WINNER_SUBSCRIPTION = gql`
  subscription {
    gameEnded {
      winner
    }
  }
`;

class Game extends Component {

  state = { name: '' };

  render() {
    const makeMove = (move) => {
      this.props.moveFn({ variables: { playerId: this.state.name, move: move } });
    };

    return (<div>
      <p>
        Player name:
      </p>
      <input type='text'
             value={this.state.name}
             onChange={event => this.setState({ name: event.target.value })}/>
      <br/>
      <button onClick={() => makeMove('ROCK')}>Rock</button>
      <button onClick={() => makeMove('PAPER')}>Paper</button>
      <button onClick={() => makeMove('SCISSOR')}>Scissor</button>
    </div>);
  }
}

class PreviousWinners extends Component {

  componentDidMount() {
    this.unsubscribe = this.props.subscribeToMoreItems();
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  render() {
    return (<div>
      <h2>Previous winners</h2>
      <ul>{this.props.winners.map(winner => (<li>{winner}</li>))}</ul>
    </div>);
  }
}

export default class HomePage extends Component {

  state = { winners: [] };

  render() {
    return (
      <div>
        <h1>Rock Paper Scissor</h1>
        <Mutation mutation={MAKE_MOVE}>
          {(moveFn) =>
            <Game moveFn={moveFn}/>
          }
        </Mutation>

        <Subscription
          subscription={GAME_ENDED_SUBSCRIPTION}>
          {({ loading, data }) => {
            if (!loading) {
              return (<div>
                <h4>Game ended</h4>
                <p>Player 1: {data.gameEnded.player1Id}</p>
                <p>Player 1 move: {data.gameEnded.player1Move}</p>
                <p>Player 2: {data.gameEnded.player2Id}</p>
                <p>Player 2 move: {data.gameEnded.player2Move}</p>
                <p>Winner: {data.gameEnded.winner}</p>
              </div>);
            }
            return null;
          }
          }
        </Subscription>
        <Query query={WINNERS_QUERY}>
          {({ loading, error, data, subscribeToMore }) => {
            if (error) return <p>Error :(</p>;
            if (loading) return null;
            const subscribeToMoreItems = () => {
              return subscribeToMore({
                document: WINNER_SUBSCRIPTION,
                updateQuery: (prev, { subscriptionData }) => {
                  console.log('fds');
                  const newWinner = subscriptionData.data.gameEnded.winner;

                  if (newWinner) {
                    return Object.assign({}, prev, {
                      winners: [newWinner, ...prev.winners],
                    });
                  }
                },
              });
            };

            return (<PreviousWinners winners={data.winners} subscribeToMoreItems={subscribeToMoreItems}/>);
          }}
        </Query>

      </div>
    );
  }
}
