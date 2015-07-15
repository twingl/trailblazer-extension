/**
 * Sets a list on the target's class (if not already present) and appends the
 * method's name to that list, indicating that it is one of a store's query
 * method
 */
export function query(target, name, descriptor) {
  target.queryFunctions = target.queryFunctions || [];
  target.queryFunctions.push(name);
};

/**
 * Populates a map of flux action constants on the target's class in order for
 * them to be bound on instantiation of said class.
 *
 * Motivation here is that we don't want to have to manually write out the bind
 * call in the constructor every time we add a new action handler; it's much
 * more fitting as a decorator to the handler function.
 */
export function action(actionName) {
  return function(target, name, descriptor) {
    if (!actionName) throw new Error(`Invalid action name for ${name}`);
    target.fluxActions = target.fluxActions || new Map();
    target.fluxActions.set(actionName, name);
  }
};

export default {
  action,
  query
};
