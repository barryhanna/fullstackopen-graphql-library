const { ApolloServer } = require('@apollo/server');
const {
	startStandaloneServer,
} = require('@apollo/server/standalone');
const { v1: uuid } = require('uuid');

let authors = [
	{
		name: 'Robert Martin',
		id: 'afa51ab0-344d-11e9-a414-719c6709cf3e',
		born: 1952,
	},
	{
		name: 'Martin Fowler',
		id: 'afa5b6f0-344d-11e9-a414-719c6709cf3e',
		born: 1963,
	},
	{
		name: 'Fyodor Dostoevsky',
		id: 'afa5b6f1-344d-11e9-a414-719c6709cf3e',
		born: 1821,
	},
	{
		name: 'Joshua Kerievsky', // birthyear not known
		id: 'afa5b6f2-344d-11e9-a414-719c6709cf3e',
	},
	{
		name: 'Sandi Metz', // birthyear not known
		id: 'afa5b6f3-344d-11e9-a414-719c6709cf3e',
	},
];

/*
 *
 * It might make more sense to associate a book with its author by storing the author's id in the context of the book instead of the author's name
 * However, for simplicity, we will store the author's name in connection with the book
 */

let books = [
	{
		title: 'Clean Code',
		published: 2008,
		author: 'Robert Martin',
		id: 'afa5b6f4-344d-11e9-a414-719c6709cf3e',
		genres: ['refactoring'],
	},
	{
		title: 'Agile software development',
		published: 2002,
		author: 'Robert Martin',
		id: 'afa5b6f5-344d-11e9-a414-719c6709cf3e',
		genres: ['agile', 'patterns', 'design'],
	},
	{
		title: 'Refactoring, edition 2',
		published: 2018,
		author: 'Martin Fowler',
		id: 'afa5de00-344d-11e9-a414-719c6709cf3e',
		genres: ['refactoring'],
	},
	{
		title: 'Refactoring to patterns',
		published: 2008,
		author: 'Joshua Kerievsky',
		id: 'afa5de01-344d-11e9-a414-719c6709cf3e',
		genres: ['refactoring', 'patterns'],
	},
	{
		title:
			'Practical Object-Oriented Design, An Agile Primer Using Ruby',
		published: 2012,
		author: 'Sandi Metz',
		id: 'afa5de02-344d-11e9-a414-719c6709cf3e',
		genres: ['refactoring', 'design'],
	},
	{
		title: 'Crime and punishment',
		published: 1866,
		author: 'Fyodor Dostoevsky',
		id: 'afa5de03-344d-11e9-a414-719c6709cf3e',
		genres: ['classic', 'crime'],
	},
	{
		title: 'The Demon ',
		published: 1872,
		author: 'Fyodor Dostoevsky',
		id: 'afa5de04-344d-11e9-a414-719c6709cf3e',
		genres: ['classic', 'revolution'],
	},
];

/*
  you can remove the placeholder query once your first own has been implemented
*/

const typeDefs = `
	type Book {
		title: String!
		published: Int!
		author: String!
		genres: [String!]
		id: String!
	}

	type Author {
		name: String!
		id: String!
		born: Int
	}

	type AuthorResult {
		name: String!
		bookCount: Int!
		born: Int
	}

  type Query {
    bookCount: Int
    authorCount: Int
	allBooks(author: String, genre: String): [Book!]!
	allAuthors: [AuthorResult!]!
  }

  type Mutation {
	addBook(
		title: String!
		author: String!
		published: Int!
		genres: [String!]!
	): Book
	editAuthor(
		name: String!
		setBornTo: Int!
	): Author
  }
`;

const resolvers = {
	Query: {
		bookCount: () => {
			return books.length;
		},
		authorCount: () => {
			return authors.length;
		},
		allBooks: (root, args) => {
			let allBooks = books;
			if (args.author) {
				allBooks = books.filter(
					(book) => book.author === args.author
				);
			}
			if (args.genre) {
				if (args.author) {
					allBooks = allBooks.filter(
						(book) => book.genres.indexOf(args.genre) >= 0
					);
				} else {
					allBooks = books.filter(
						(book) => book.genres.indexOf(args.genre) >= 0
					);
				}
			}

			return allBooks;
		},
		allAuthors: () => {
			return books.reduce((authorList, book) => {
				const authorInList = authorList.findIndex(
					(entry) => entry.name === book.author
				);

				if (authorInList >= 0) {
					const newBookCount = authorList[authorInList].bookCount + 1;
					authorList[authorInList] = {
						name: book.author,
						born: authorList[authorInList]?.born,
						bookCount: newBookCount,
					};
				} else {
					const authorBorn = authors.find(
						(author) => author.name === book.author
					)?.born;
					authorList.push({
						name: book.author,
						born: authorBorn,
						bookCount: 1,
					});
				}
				return authorList;
			}, []);
		},
	},
	Mutation: {
		addBook: (root, args) => {
			const book = { ...args, id: uuid() };
			const authorDoesNotExist =
				authors.filter((author) => author.name === args.author)
					.length === 0;
			if (authorDoesNotExist) {
				authors.push({
					id: 'afa51ab0-344d-11e9-a414-719c6709cf3e',
					name: book.author,
					born: null,
				});
			}
			books = books.concat(book);
			return book;
		},
		editAuthor: (root, args) => {
			const name = args.name;
			const birthYear = args.setBornTo;
			const author = authors.find((author) => author.name === name);

			if (!author) {
				return {
					editAuthor: null,
				};
			}

			const authorIndex = authors.findIndex(
				(author) => author.name == name
			);
			authors[authorIndex].born = birthYear;

			return authors[authorIndex];
		},
	},
};

const server = new ApolloServer({
	typeDefs,
	resolvers,
});

startStandaloneServer(server, {
	listen: { port: 4000 },
}).then(({ url }) => {
	console.log(`Server ready at ${url}`);
});
