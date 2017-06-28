import Ember from 'ember';
import { service } from 'ember-decorators/service';
import { task } from 'ember-concurrency';

export default Ember.Component.extend({
  @service store: null,

  classNames: ['form--sshkey'],
  classNameBindings: ['valueError:form-error'],
  isSaving: false,

  didInsertElement() {
    let id = this.get('repo.id');
    let store = this.get('store');
    const currentKey = store.peekRecord('ssh_key', id);
    if (currentKey) {
      store.unloadRecord(currentKey);
      // It seems there's a bug in unloadRecord that prevents it from fully
      // clearing the store, so we need to do more cleanup
      let recordMap = store._internalModelsFor('ssh-key');
      let internalModel = recordMap.get(currentKey.get('id'));
      if (internalModel) {
        recordMap.remove(internalModel, currentKey.get('id'));
      }
    }

    return this.set('model', store.createRecord('ssh_key', { id }));
  },

  isValid() {
    if (Ember.isBlank(this.get('value'))) {
      this.set('valueError', 'Value can\'t be blank.');
      return false;
    } else {
      return true;
    }
  },

  reset() {
    return this.setProperties({
      description: null,
      value: null
    });
  },

  valueChanged: Ember.observer('value', function () {
    return this.set('valueError', false);
  }),

  addErrorsFromResponse(errArr) {
    if (errArr !== undefined && errArr.length) {
      let error = errArr[0].detail;

      if (error.code === 'not_a_private_key') {
        return this.set('valueError', 'This key is not a private key.');
      } else if (error.code === 'key_with_a_passphrase') {
        return this.set('valueError', 'The key can\'t have a passphrase.');
      }
    }
  },

  save: task(function* () {
    this.set('valueError', false);

    if (this.isValid()) {
      const sshKey = this.get('model');
      sshKey.setProperties({
        description: this.get('description'),
        value: this.get('value')
      });

      try {
        yield sshKey.save();
        this.reset();
        return this.sendAction('sshKeyAdded', sshKey);
      } catch ({ errors }) {
        return this.addErrorsFromResponse(errors);
      }
    }
  }).drop()
});
