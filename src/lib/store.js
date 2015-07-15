import FluxxorStore from 'fluxxor/lib/store';

class Store extends FluxxorStore {

  constructor(options) {
    super(options);

    // Bind the handlers for flux actions
    if (this.fluxActions) {
      for (var [action, handler] of this.fluxActions) {
        this.bindActions(action, this[handler]);
      }
    }
  }

}

export default Store;
