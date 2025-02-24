const promisify = require("util").promisify;
const scheduler = require("node-schedule");
const email = require("helper/email");

const User = require("models/user");
const getAllIds = promisify(User.getAllIds);
const getUser = promisify(User.getById);

// How long between registration and the delivery of the welcome email
const INTERVAL = 1000 * 60 * 60 * 24; // 24 hours

// How often to check for new users to schedule emails
const LOOP_INTERVAL = 1000 * 60 * 10; // 10 minutes

module.exports = async function scheduleWelcomeEmails() {
  console.log("Starting welcome email scheduler...");

  const check = async () => {
    try {
      console.log("Checking for new users to schedule emails...");
      const uids = await getAllIds();

      for (const uid of uids) {
        const user = await getUser(uid);

        // Determine the joined date directly inside the loop
        let joinedDate = null;

        if (user.subscription?.plan) {
          joinedDate = new Date(user.subscription.created * 1000); // Stripe
        } else if (user.paypal?.status) {
          joinedDate = new Date(user.paypal.create_time); // PayPal
        }

        // Skip if the joined date cannot be determined
        if (!joinedDate) {
          console.error(`Unable to determine joined date for user ${uid}`);
          continue;
        } else {
            console.log(`User ${uid} joined on ${joinedDate}`);
        }

        const oneDayAfterJoining = joinedDate.getTime() + INTERVAL;

        // Only schedule emails if the 24-hour mark is within the next 10 minutes
        const now = Date.now();
        
        if (oneDayAfterJoining > now && oneDayAfterJoining <= now + LOOP_INTERVAL) {
          console.log(`Scheduling welcome email for user ${uid} at ${new Date(oneDayAfterJoining)}`);
          scheduler.scheduleJob(new Date(oneDayAfterJoining), async () => {
            try {
              console.log(`Sending welcome email to user ${uid}`);
              await email.WELCOME(uid);
            } catch (err) {
              console.error(`Failed to send welcome email to user ${uid}:`, err);
            }
          });
        } else {
            console.log(`User ${uid} is not due for a welcome email`);
        }
      }
    } catch (err) {
      console.error("Error in welcome email scheduler:", err);
    }
  };

  check();
  setInterval(check, LOOP_INTERVAL);
};