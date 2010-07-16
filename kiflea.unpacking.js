/*
	This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
	
	Author: Jelle De Loecker
	Version: Trunk
	Last Modified: Trunk
*/

var base64chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'.split("");
var base64inv = {}; 
for (var i = 0; i < base64chars.length; i++) { 
  base64inv[base64chars[i]] = i; 
}

function base64_decode_map(string){
    var source = base64_decode_array(string);
    var destination = new Array();
    for (var i = 0; i <= source.length; i += 4) {
        var tempTile = source[i] | source[i + 1] << 8 | source[i + 2] << 16 | source[i + 3] << 24;
        destination.push(tempTile)
    }
    
    return destination;
}

function base64_decode_array (s)
{
  // remove/ignore any characters not in the base64 characters list
  //  or the pad character -- particularly newlines
  s = s.replace(new RegExp('[^'+base64chars.join("")+'=]', 'g'), "");
 
  // replace any incoming padding with a zero pad (the 'A' character is zero)
  var p = (s.charAt(s.length-1) == '=' ? 
          (s.charAt(s.length-2) == '=' ? 'AA' : 'A') : ""); 
  
  var r = [];
  
  s = s.substr(0, s.length - p.length) + p;
 
  // increment over the length of this encrypted string, four characters at a time
  for (var c = 0; c < s.length; c += 4) {
 
    // each of these four characters represents a 6-bit index in the base64 characters list
    //  which, when concatenated, will give the 24-bit number for the original 3 characters
    var n = (base64inv[s.charAt(c)] << 18) + (base64inv[s.charAt(c+1)] << 12) +
            (base64inv[s.charAt(c+2)] << 6) + base64inv[s.charAt(c+3)];

 
    // split the 24-bit number into the original three 8-bit (ASCII) characters
    r.push((n >>> 16) & 255);
    r.push((n >>> 8) & 255);
    r.push(n & 255);
    

  }
   // remove any zero pad that was added to make this a multiple of 24 bits
  return r;
}



function base64_encode (s)
{
  // the result/encoded string, the padding string, and the pad count
  var r = ""; 
  var p = ""; 
  var c = s.length % 3;
 
  // add a right zero pad to make this string a multiple of 3 characters
  if (c > 0) { 
    for (; c < 3; c++) { 
      p += '='; 
      s += "\0"; 
    } 
  }
 
  // increment over the length of the string, three characters at a time
  for (c = 0; c < s.length; c += 3) {
 
    // we add newlines after every 76 output characters, according to the MIME specs
    if (c > 0 && (c / 3 * 4) % 76 == 0) { 
      r += "\r\n"; 
    }
 
    // these three 8-bit (ASCII) characters become one 24-bit number
    var n = (s.charCodeAt(c) << 16) + (s.charCodeAt(c+1) << 8) + s.charCodeAt(c+2);
 
    // this 24-bit number gets separated into four 6-bit numbers
    n = [(n >>> 18) & 63, (n >>> 12) & 63, (n >>> 6) & 63, n & 63];
 
    // those four 6-bit numbers are used as indices into the base64 character list
    r += base64chars[n[0]] + base64chars[n[1]] + base64chars[n[2]] + base64chars[n[3]];
  }
   // add the actual padding string, after removing the zero pad
  return r.substring(0, r.length - p.length) + p;
}
