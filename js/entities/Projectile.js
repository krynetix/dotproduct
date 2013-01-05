/**
 * @fileoverview Description of this file.
 * @author sharvil.nanavati@gmail.com (Sharvil Nanavati)
 */

goog.provide('dotprod.entities.Projectile');

goog.require('dotprod.entities.Entity');

/**
 * @constructor
 * @extends {dotprod.entities.Entity}
 * @implements {dotprod.model.ModelObject}
 * @param {!dotprod.Game} game
 * @param {!dotprod.entities.Player} owner
 * @param {number} level
 * @param {number} lifetime
 * @param {number} damage
 * @param {number} bounceCount
 */
dotprod.entities.Projectile = function(game, owner, level, lifetime, damage, bounceCount) {
  goog.base(this, game);

  /**
   * @type {boolean}
   * @private
   */
  this.isValid_ = true;

  /**
   * @type {!dotprod.entities.Player}
   * @protected
   */
  this.owner_ = owner;

  /**
   * @type {number}
   * @protected
   */
  this.level_ = level;

  /**
   * @type {number}
   * @protected
   */
  this.lifetime_ = lifetime;

  /**
   * @type {number}
   * @protected
   */
  this.damage_ = damage;

  /**
   * @type {number}
   * @protected
   */
  this.bounceCount_ = bounceCount;

  game.getSimulation().registerObject(this);
  game.getProjectileIndex().addProjectile(owner, this);
};
goog.inherits(dotprod.entities.Projectile, dotprod.entities.Entity);

dotprod.entities.Projectile.prototype.getType = goog.abstractMethod;

/**
 * @param {!dotprod.entities.Player} player
 * @protected
 */
dotprod.entities.Projectile.prototype.checkPlayerCollision_ = goog.abstractMethod;

/**
 * @param {dotprod.entities.Player} player The player who was directly hit or null if there was no direct hit.
 * @protected
 */
dotprod.entities.Projectile.prototype.explode_ = goog.abstractMethod;

/**
 * @override
 */
dotprod.entities.Projectile.prototype.isAlive = function() {
  return true;
};

/**
 * @override
 */
dotprod.entities.Projectile.prototype.isValid = function() {
  return this.isValid_;
};

/**
 * @return {number}
 */
dotprod.entities.Projectile.prototype.getLevel = function() {
  return this.level_;
};

/**
 * @return {number}
 */
dotprod.entities.Projectile.prototype.getBounceCount = function() {
  return this.bounceCount_;
};

dotprod.entities.Projectile.prototype.invalidate = function() {
  this.isValid_ = false;
};

dotprod.entities.Projectile.prototype.advanceTime = function() {
  if (--this.lifetime_ <= 0) {
    this.invalidate();
    return;
  }

  this.updatePosition_();
  this.game_.getPlayerIndex().some(goog.bind(this.checkPlayerCollision_, this));
};

/**
 * @override
 */
dotprod.entities.Projectile.prototype.bounce_ = function() {
  if (this.bounceCount_ == 0) {
    this.explode_(null);
  } else if (this.bounceCount_ > 0) {
    --this.bounceCount_;
  }
};
