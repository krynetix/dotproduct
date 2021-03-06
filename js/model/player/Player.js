goog.provide('model.player.Player');
goog.provide('model.player.Player.Presence');

goog.require('goog.array');

goog.require('model.Entity');
goog.require('model.BombBay');
goog.require('model.Burst');
goog.require('model.Gun');
goog.require('model.MineLayer');
goog.require('model.Weapon.Type');

/**
 * @constructor
 * @extends {model.Entity}
 * @param {!Game} game
 * @param {string} id
 * @param {string} name
 * @param {number} team
 * @param {number} ship
 * @param {number} bounty
 */
model.player.Player = function(game, id, name, team, ship, bounty) {
  goog.base(this, game);

  /**
   * @type {!Object}
   * @protected
   */
  this.settings_ = game.getSettings();

  /**
   * @type {!Object}
   * @protected
   */
  this.shipSettings_ = this.settings_['ships'][ship];

  /**
   * @type {!model.Gun}
   * @protected
   */
  this.gun_ = new model.Gun(game, this.shipSettings_['bullet'], this);

  /**
   * @type {!model.BombBay}
   * @protected
   */
  this.bombBay_ = new model.BombBay(game, this.shipSettings_['bomb'], this);

  /**
   * @type {!model.MineLayer}
   * @protected
   */
  this.mineLayer_ = new model.MineLayer(game, this.shipSettings_['bomb'], this);

  /**
   * @type {!model.Burst}
   * @protected
   */
  this.burst_ = new model.Burst(game, this.shipSettings_['burst'], this);

  /**
   * @type {string}
   * @protected
   */
  this.id_ = id;

  /**
   * @type {string}
   * @protected
   */
  this.name_ = name;

  /**
   * @type {number}
   * @protected
   */
  this.team_ = team;

  /**
   * @type {number}
   * @protected
   */
  this.angleInRadians_ = 0;

  /**
   * @type {number}
   * @protected
   */
  this.energy_ = 0;

  /**
   * @type {number}
   * @protected
   */
  this.maxEnergy_ = 0;

  /**
   * @type {number}
   * @protected
   */
  this.ship_;

  /**
   * @type {number}
   * @protected
   */
  this.bounty_;

  /**
   * @type {!Array.<!model.projectile.Projectile>}
   * @private
   */
  this.projectiles_ = [];

  /**
   * @type {!model.player.Player.Presence}
   * @protected
   */
  this.presence_ = model.player.Player.Presence.DEFAULT;

  /**
   * @type {number}
   * @protected
   */
  this.points_ = 0;

  /**
   * @type {number}
   * @protected
   */
  this.wins_ = 0;

  /**
   * @type {number}
   * @protected
   */
  this.losses_ = 0;

  this.setShip(ship);
  this.bounty_ = bounty;
};
goog.inherits(model.player.Player, model.Entity);

/**
 * @enum {number}
 */
model.player.Player.Presence = {
  DEFAULT: 0,
  TYPING: 1,
  AWAY: 2,
  ALL: 0x7FFFFFFF
};

/**
 * @type {string}
 * @const
 */
model.player.Player.SYSTEM_PLAYER_ID = '0';

/**
 * @return {string}
 */
model.player.Player.prototype.getId = function() {
  return this.id_;
};

/**
 * @return {string}
 */
model.player.Player.prototype.getName = function() {
  return this.name_;
};

/**
 * @return {number}
 */
model.player.Player.prototype.getEnergy = function () {
  return Math.floor(this.energy_);
};

/**
 * @return {number}
 */
model.player.Player.prototype.getMaxEnergy = function () {
  return this.maxEnergy_;
};

/**
 * @return {number}
 */
model.player.Player.prototype.getShip = function() {
  return this.ship_;
};

/**
 * @return {number}
 */
model.player.Player.prototype.getTeam = function() {
  return this.team_;
};

/**
 * @return {number}
 */
model.player.Player.prototype.getPoints = function() {
  return this.points_;
};

/**
 * @return {number}
 */
model.player.Player.prototype.getBounty = function () {
  return this.bounty_;
};

/**
 * @return {boolean} True if the player is alive in-game, false otherwise.
 */
model.player.Player.prototype.isAlive = function() {
  return this.energy_ > 0;
};

/**
 * Returns true if this player is a friend of (on the same team as) the other player.
 *
 * @param {!model.player.Player} other
 * @return {boolean}
 */
model.player.Player.prototype.isFriend = function(other) {
  return this.team_ == other.team_;
};

/**
 * @param {model.player.Player.Presence} presence
 */
model.player.Player.prototype.setPresence = function(presence) {
  this.presence_ |= presence;
};

/**
 * @param {model.player.Player.Presence} presence
 */
model.player.Player.prototype.clearPresence = function(presence) {
  this.presence_ &= ~presence;
};

/**
 * @param {model.player.Player.Presence} presence
 * @return {boolean}
 */
model.player.Player.prototype.hasPresence = function(presence) {
  return (this.presence_ & presence) != 0;
};

/**
 * @param {number} ship
 */
model.player.Player.prototype.setShip = function(ship) {
  this.ship_ = ship;
  this.shipSettings_ = this.settings_['ships'][this.ship_];
  this.gun_ = new model.Gun(this.game_, this.shipSettings_['bullet'], this);
  this.bombBay_ = new model.BombBay(this.game_, this.shipSettings_['bomb'], this);
  this.mineLayer_ = new model.MineLayer(this.game_, this.shipSettings_['bomb'], this);
  this.burst_ = new model.Burst(this.game_, this.shipSettings_['burst'], this);

  this.position_ = math.Vector.ZERO;
  this.velocity_ = math.Vector.ZERO;
  this.energy_ = 0;
  this.bounty_ = 0;
  this.xRadius_ = this.shipSettings_['xRadius'];
  this.yRadius_ = this.shipSettings_['yRadius'];
  this.clearProjectiles_();
};

/**
 * @param {number} timeDiff
 * @param {!Object} weaponData
 */
model.player.Player.prototype.onWeaponFired = function(timeDiff, weaponData) {
  switch (weaponData['type']) {
    case this.gun_.getType():
      this.gun_.onFired(timeDiff, weaponData);
      break;
    case this.bombBay_.getType():
      this.bombBay_.onFired(timeDiff, weaponData);
      break;
    case this.mineLayer_.getType():
      this.mineLayer_.onFired(timeDiff, weaponData);
      break;
    case this.burst_.getType():
      this.burst_.onFired(timeDiff, weaponData);
      break;
    default:
      break;
  }
};

/**
 * @param {number} angle
 * @param {!math.Vector} position
 * @param {!math.Vector} velocity
 */
model.player.Player.prototype.respawn = goog.abstractMethod;

/**
 * Called when the player takes damage from a projectile fired by some other player.
 *
 * @param {!model.player.Player} player The player whose projectile is causing the damage.
 * @param {!model.projectile.Projectile} projectile The projectile that caused the damage.
 * @param {number} damage The damage, in energy units, caused by the projectile.
 */
model.player.Player.prototype.onDamage = goog.nullFunction;

/**
 * Called when this player is killed by someone.
 */
model.player.Player.prototype.onDeath = function() {
  ++this.losses_;
  this.bounty_ = 0;
  this.energy_ = 0;
};

/**
 * Called when this player kills someone.
 *
 * @param {!model.player.Player} killee The player who we just killed.
 * @param {number} extraPoints How many points were gained by killing this player.
 */
model.player.Player.prototype.onKill = function(killee, extraPoints) {
  this.points_ += this.settings_['game']['killPoints'] + extraPoints;
  ++this.wins_;
};

/**
 * Called when this player's score gets updated from the server.
 *
 * @param {number} points
 * @param {number} wins
 * @param {number} losses
 */
model.player.Player.prototype.onScoreUpdate = function(points, wins, losses) {
  this.points_ = points;
  this.wins_ = wins;
  this.losses_ = losses;
};

/**
 * Called when the server tells us that this player collected a prize.
 */
model.player.Player.prototype.onPrizeCollected = function() {
  ++this.bounty_;
};

/**
 * @param {!model.projectile.Projectile} projectile
 */
model.player.Player.prototype.addProjectile = function(projectile) {
  this.projectiles_ = goog.array.filter(this.projectiles_, function(p) { return p.isValid(); });
  goog.array.extend(this.projectiles_, projectile);
};

/**
 * @protected
 */
model.player.Player.prototype.clearProjectiles_ = function() {
  goog.array.forEach(this.projectiles_, function(projectile) {
    projectile.invalidate();
  });
  this.projectiles_ = [];
};

/**
 * @override
 */
model.player.Player.prototype.onInvalidate_ = function() {
  goog.base(this, 'onInvalidate_');

  this.clearProjectiles_();
};
