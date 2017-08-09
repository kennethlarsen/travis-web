import { test } from 'qunit';
import moduleForAcceptance from 'travis/tests/helpers/module-for-acceptance';
import profilePage from 'travis/tests/pages/profile';

moduleForAcceptance('Acceptance | profile/update hooks', {
  beforeEach() {
    const currentUser = server.create('user', {
      name: 'Sara Ahmed',
      login: 'feministkilljoy',
      repos_count: 3
    });

    signInUser(currentUser);

    // create organization
    server.create('account', {
      name: 'Feminist Killjoys',
      type: 'organization',
      login: 'killjoys',
      repos_count: 30
    });

    // create active hook
    server.create('hook', {
      name: 'living-a-feminist-life',
      owner_name: 'feministkilljoy',
      active: true,
      admin: true
    });

    // create inactive hook
    server.create('hook', {
      name: 'willful-subjects',
      owner_name: 'feministkilljoy',
      active: false,
      admin: true
    });

    // create hook without admin permissions
    server.create('hook', {
      name: 'affect-theory-reader',
      owner_name: 'feministkilljoy',
      active: true,
      admin: false
    });

    // create other random hook to ensure correct filtering
    server.create('hook', {
      name: 'feminism-is-for-everybody',
      owner_name: 'bellhooks',
      active: false
    });
  }
});

test('updating hooks', function (assert) {
  profilePage.visit({ username: 'feministkilljoy' });

  andThen(() => {
    assert.equal(profilePage.administerableHooks(0).ariaChecked, 'true', 'expected the active hook to have aria-checked=true');
    assert.equal(profilePage.administerableHooks(0).role, 'switch', 'expected the hook to be marked as a switch');
    assert.equal(profilePage.administerableHooks(1).ariaChecked, 'false', 'expected the inactive hook to have aria-checked=false');
  });

  profilePage.administerableHooks(0).toggle();
  profilePage.administerableHooks(1).toggle();
  profilePage.unadministerableHooks(0).toggle();

  andThen(() => {
    assert.notOk(server.db.hooks[0].active, 'expected formerly active hook to be inactive');
    assert.equal(profilePage.administerableHooks(0).ariaChecked, 'false', 'expected the newly-inactive hook to have aria-checked=false');
    assert.ok(server.db.hooks[1].active, 'expected formerly inactive hook to be active');
    assert.ok(server.db.hooks[2].active, 'expected unadministerable hook to be unchanged');
  });
});
