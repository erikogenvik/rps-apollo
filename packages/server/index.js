
const {ApolloServer, gql, PubSub} = require('apollo-server');
const pubsub = new PubSub();

const PORT = 4000;

const typeDefs = gql`
  enum MoveType {
    ROCK
    PAPER
    SCISSOR
  }

  enum GameStatus {
    NOTSTARTED
    STARTED
  }
  
  type Game {
    player1Id: String!
    player2Id: String!
    player1Move: MoveType!
    player2Move: MoveType!
    winner: String
  }

  type Query {
    gameStatus: GameStatus!
    lastGame: Game,
    winners: [String]!
  }
  
  type Mutation {
    makeMove(playerId: String!, move: MoveType!): String
  }

  type Subscription {
    gameEnded: Game
    statusChanged: GameStatus
  }  
`;

let currentGame = null;
let lastGame = null;
const winners = [];


const resolvers = {
    Query: {
        gameStatus: async () => {
            return currentGame === null ? 'NOTSTARTED' : 'STARTED';
        },
        lastGame: async () => {
            return lastGame;
        },
        winners: async () => {
            return winners;
        }

    },
    Mutation: {
        makeMove: async (_, {playerId, move}) => {
            console.log("Making move");
            if (!currentGame) {
                currentGame = {player1Id: playerId, player1Move: move};
                pubsub.publish('statusChanged', {statusChanged: 'STARTED'});
            } else {
                currentGame = {...currentGame, player2Id: playerId, player2Move: move};
                if (currentGame.player1Move === 'ROCK') {
                    if (move === 'PAPER') {
                        currentGame.winner = playerId;
                    } else if (move === 'SCISSOR') {
                        currentGame.winner = currentGame.player1Id;
                    }
                } else if (currentGame.player1Move === 'PAPER') {
                    if (move === 'SCISSOR') {
                        currentGame.winner = playerId;
                    } else if (move === 'ROCK') {
                        currentGame.winner = currentGame.player1Id;
                    }
                } else if (currentGame.player1Move === 'SCISSOR') {
                    if (move === 'ROCK') {
                        currentGame.winner = playerId;
                    } else if (move === 'PAPER') {
                        currentGame.winner = currentGame.player1Id;
                    }
                }
                if (currentGame.winner) {
                    winners.push(currentGame.winner);
                }
                pubsub.publish('gameEnded', {gameEnded: currentGame});
                pubsub.publish('statusChanged', {statusChanged: 'NOTSTARTED'});
                lastGame = {...currentGame};
                currentGame = null;
            }
            return "";
        }
    },
    Subscription: {
        gameEnded: {
            subscribe: () => pubsub.asyncIterator('gameEnded'),
        },
        statusChanged: {
            subscribe: () => pubsub.asyncIterator('statusChanged'),
        }

    }
};

const schema = {
    typeDefs,
    resolvers
};

const server = new ApolloServer(schema);

server.listen(PORT).then(({url}) => {
    console.log(`Server ready at ${url}`);
});
