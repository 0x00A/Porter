
function DAL(verbs, port, ip, protocol) {

  var self = this;

  this.data = {};
  this.requests = {};
  
  this.clear = function() {
    for(var d in self.data) {
      delete self.data[d];
    }
  }
  
  function normalizePath(path, keys) {
    path = path
      .concat('/?')
      .replace(/\/\(/g, '(?:/')
      .replace(/(\/)?(\.)?:(\w+)(?:(\(.*?\)))?(\?)?/g, function(_, slash, format, key, capture, optional){
        keys.push(key);
        slash = slash || '';
        return ''
          + (optional ? '' : slash)
          + '(?:'
          + (optional ? slash : '')
          + (format || '') + (capture || '([^/]+?)') + ')'
          + (optional || '');
      })
      .replace(/([\/.])/g, '\\$1')
      .replace(/\*/g, '(.+)');
    return new RegExp('^' + path + '$', 'i');
  }

  function req(url, method, replace, data, callback) {
    url = [protocol, '://', ip, ':', port, url, '?callback=?'].join('');
    
    if(!self.data[url] || remote) {

      $.ajax({
         url:      url,
         type:     method,
         dataType: 'json',
         contentType: 'application/json',
         data:     data : null,
         beforeSend: function(xhr) {

           xhr.setRequestHeader('Accept', 'application/json');

           if(data.username && data.password) {
             xhr.setRequestHeader('authorization', 'Basic ' + encodeBase64(data.username + ':' + data.password));
           }
         },

         success: function(data, textStatus, XMLHttpRequest) {
           self.data[url] = data;
           callback(null, data, textStatus, XMLHttpRequest);
         },
         error: function(XMLHttpRequest, textStatus, errorThrown){
           callback([XMLHttpRequest, textStatus, errorThrown], null);
         }

      });

    }
    else {
      callback(self.data[url]);
    }
  }

  for (var verb in verbs) {
    if (verbs.hasOwnProperty(verb)) {
      if(!requests[verb]) {
        requests[verb] = {};
      }
      for (var request in verbs[verb]) {
        if (verbs[verb].hasOwnProperty(request)) {
          requests[verb][request] = (function(url) {
            var keys = [], 
                matcher = normalizePath(url, keys);
            
            return function() {
              var args = Array.prototype.slice.call(arguments),
                  alen = args.length,
                  klen = keys.length,
                  key;
                  
              if (klen > 0) {
                // If we have keys, then we need at least two arguments
                // and first argument in a two-argument pair can be assumed
                // to be the replacement map.
                if (alen < 2) {
                  throw new Error('Cannot execute request ' + request + ' without replacement map');
                }
                else if (alen === 2) {
                  args.splice(1, -1, null);
                }
                
                if (typeof args[0] === 'string') {
                  if (klen > 1) {
                    throw new Error('Wrong number of keys in replacement. Expected ' + klen + ' got 1.');
                  }
                  
                  key = keys[0];
                  url = url.replace(':' + key, args[0]);
                }
                else {
                  while (klen--) {
                    key = keys[len];
                    url = url.replace(':' + key, args[0][key])
                  }
                }
              }
              else {
                // If we don't have keys, then we need at least one argument
                // and the first argument in a two-argument pair can be assumed
                // to be the data for the request.
                if (alen < 1 || alen > 2) {
                  throw new Error('Cannot execute request ' + request + ' with ' + alen + ' arguments.');
                }
                else if (alen === 1) {
                  args.splice(0, -1, null);
                }
                
                args.splice(0, -1, null);
              }
              
              args = [url, verb].concat(args);
              req.call(null, args);
            }
          })(verbs[verb][request]);
        }
      }
    }
  }
  
  return this;
}
