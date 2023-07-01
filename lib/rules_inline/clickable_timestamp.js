// Process timestamps like 03:25

'use strict';

// timestamp regex (YY:YX:YX) where Y is an optional digit and X is a required digit
var SCHEME_RE = /([0-9]?[0-9]:)?[0-5]?[0-9]:[0-5]?[0-9]/;

// pending regex for the proto part
var SCHEME_PENDING = /([0-9]?[0-9]):([0-9])/;

module.exports = function clickable_timestamp(state, silent) {
  var pos, match, proto, link, url, fullUrl, token;

  if (!state.md.options.timestamps) return false;

  // don't run in an anchor tag or some other type of link
  if (state.linkLevel > 0) return false;

  pos = state.pos;

  // check next character is a colon
  if (state.src.charCodeAt(pos) !== 0x3A/* : */) {
    return false;
  }

  var _pending = `${state.pending}${String.fromCharCode(state.src.charCodeAt(pos))}${String.fromCharCode(state.src.charCodeAt(pos+1))}`;

  // match the pending part to our pending regex
  match = _pending.match(SCHEME_PENDING);
  if (!match) {
    return false;
  }

  // create a proto from our match
  proto = match[0].slice(0, match[0].length - 2);

  // extract the full timestamp and match it against our complete regex
  link = state.src.slice(pos - proto.length).match(SCHEME_RE);
  if (!link) return false;

  url = link[0];

  // disallow '*' at the end of the link (conflicts with emphasis)
  url = url.replace(/\*+$/, '');

  fullUrl = state.md.options.timestampHrefFormat.replace('$$time$$', url);

  if (!silent) {
    state.pending = state.pending.slice(0, -proto.length);

    token         = state.push('timestamp_open', 'a', 1);
    token.attrs   = [ [ 'href', fullUrl ] ];
    token.markup  = 'timestamp';
    token.info    = 'auto';

    token         = state.push('text', '', 0);
    token.content = url;

    token         = state.push('timestamp_close', 'a', -1);
    token.markup  = 'timestamp';
    token.info    = 'auto';
  }

  // increment our state position according to how it's done in the linkify inline parser
  state.pos += url.length - proto.length;

  return true;
};
