const { User, Event } = require('../models');
const { AuthenticationError } = require('apollo-server-express');
const { signToken } = require('../utils/auth')

const resolvers = {
  Query: {
    me: async (parent, args, context) => {
      console.log(context.user)
      if (context.user) {
        const userData = await User.findOne({ _id: context.user._id })
          .select('-__v -password')
        return userData;
      }
      throw new AuthenticationError('Not logged in');
    },

    events: async (parent, { username }) => {
      const params = username ? { username } : {};
      return Event.find(params).sort({ createdAt: -1 }) // sort most recent first

    },

    // get ONE Event
    event: async (parent, { _id }) => {
      return Event.findOne({ _id })
    },

    users: async () => {
      return User.find()
        .select('-__v -password')
        .populate('myCurrentEvent')
        .populate('myJoinedEvent');
    },
    // get a user by username
    user: async (parent, { username }) => {
      return User.findOne({ username })
        .select('-__v -password')
        .populate('myCurrentEvent')
        .populate('myJoinedEvent');
    },
  },

  Mutation: {

    addUser: async (parent, args) => {
      const user = await User.create(args);
      const token = signToken(user);

      return { token, user };
    },

    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });

      if (!user) {
        throw new AuthenticationError('Incorrect credentials');
      }

      const correctPw = await user.isCorrectPassword(password);

      if (!correctPw) {
        throw new AuthenticationError('Incorrect credentials');
      }

      const token = signToken(user);
      return { token, user };
    },

    addEvent: async (parent, args, context) => {
      // console.log(context)
      console.log(args)

      const event = await Event.create({ ...args.input });
      console.log(event)

      await User.findByIdAndUpdate(
        { _id: context.user._id },
        { $push: { myCurrentEvent: event } },
        { new: true }
      );

      return event;
    },

    joinEvent: async (parent, args, context) => {
      console.log('line87' + args)
      console.log('line88' + context)

      // const joinEvent = await Even.create({ ...args.input });
      // console.log(joinEvent)


      // add the user to the event
      await Event.findByIdAndUpdate(
        { _id: args.eventId },
        { $push: { guests: context.user.username } },
        { new: true }
      );

      // find user by id in context - add event to the user
      const updatedUser = await User.findByIdAndUpdate(
        { _id: context.user._id },
        { $push: { myJoinedEvent: args.eventId } },
        { new: true }
      );
      return updatedUser
    },



    updateEvent: async (parent, args, context) => {

      var newEvent = args.input
      console.log(args)
      console.log(newEvent)
      // console.log(args.eventId)
      // console.log(context.user)

      const updatedEvent = await Event.findByIdAndUpdate(
        { _id: args.eventId },
        { $push: { myCurrentEvent: { newEvent } } },
        { new: true, runValidators: true }

      );
      console.log(updatedEvent)

      return updatedEvent
    },

    removeEvent: async (parent, args, context) => {

      var idEvent = args._id
      // console.log(args)
      // console.log(idEvent)
      const updatedUser = await User.findByIdAndUpdate(
        { _id: context.user._id },
        { $pull: { myCurrentEvent: { idEvent } } },
        { new: true }
      );
      console.log(updatedUser)

      // console.log(context.user)

      return updatedUser
    }
  }
};

module.exports = resolvers;
