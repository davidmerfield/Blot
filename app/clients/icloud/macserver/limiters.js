import Bottleneck from "bottleneck";
import clfdate from "./util/clfdate.js";

// Create a map of limiters, one per blogID
const limiters = new Map();

/**
 * Get or create a Bottleneck limiter for a specific blogID.
 * Each blogID gets its own limiter to ensure events are processed sequentially.
 * @param {string} blogID - The blog ID for which to get the limiter.
 * @returns {Bottleneck} The Bottleneck limiter for the blogID.
 */
const getLimiterForBlogID = (blogID) => {
  if (!limiters.has(blogID)) {
    // Create a new limiter for this blogID with concurrency of 1
    console.log(clfdate(), `Creating limiter for blogID: ${blogID}`);
    const limiter = new Bottleneck({
      maxConcurrent: 1, // Only one task per blogID can run at a time
    });
    limiters.set(blogID, limiter);
  } else {
    console.log(clfdate(), `Using existing limiter for blogID: ${blogID}`);
  }

  return limiters.get(blogID);
};

/**
 * Stop and forget the limiter for a blogID. Jobs still waiting in the queue
 * are dropped (their schedule() promises reject, see isLimiterStoppedError);
 * a job already running is left to finish.
 * @param {string} blogID - The blog ID whose limiter should be removed.
 */
const removeLimiterForBlogID = (blogID) => {
  console.log(clfdate(), `Removing limiter for blogID: ${blogID}`);
  const limiter = limiters.get(blogID);
  limiters.delete(blogID);

  if (!limiter) return;

  console.log(
    clfdate(),
    `Dropping ${limiter.counts().QUEUED} queued action(s) for blogID: ${blogID}`
  );

  limiter.stop({ dropWaitingJobs: true }).catch((error) => {
    console.error(clfdate(), `Failed to stop limiter for blogID: ${blogID}`, error);
  });
};

// True if a schedule() promise rejected because its limiter was stopped
// by removeLimiterForBlogID, rather than because the job itself failed.
const isLimiterStoppedError = (error) =>
  error instanceof Bottleneck.prototype.BottleneckError &&
  /has been stopped/.test(error.message);

const getLimiterCount = () => limiters.size;

export {
  getLimiterForBlogID,
  removeLimiterForBlogID,
  getLimiterCount,
  isLimiterStoppedError,
};
