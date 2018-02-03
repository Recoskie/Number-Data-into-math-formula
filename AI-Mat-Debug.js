/***********************************************************************************
The matrices that act as the brain.
***********************************************************************************/

var AI_Mat = {
  
  /***********************************************************************************
  Three main matrices that are adjusted for faster decoding and encoding.
  ***********************************************************************************/

  SMat: [],
  CMat: [],
  PMat: [],
  
  /***********************************************************************************
  Debug output.
  ***********************************************************************************/

  debug: "",

  /***********************************************************************************
  Operator check for when creating functions. Not all operators are supported by all web browsers.
  ***********************************************************************************/

  Exp: ( function() { try { eval( "0 ** 0" ); return ( true ); } catch ( e ) { return ( false ); } } )(),

  /***********************************************************************************
  Adjust three main matrices as necessary.
  ***********************************************************************************/

  adjustSMat: function( size )
  {
    var r = new Array();

    if ( this.SMat.length > 0 ) { r = r.concat( this.SMat[ this.SMat.length - 1 ] ); }

    while ( this.SMat.length - 1 < size )
    {
      for ( var i = 0; i < r.length - 1; r[ i ] += r[ i + 1 ], i++ );

      if ( r.length < 2 ) { r[ r.length ] = 1; } else { r = ( [ 1 ] ).concat( r ); }

      this.SMat[ this.SMat.length ] = new Array();
      this.SMat[ this.SMat.length - 1 ] = this.SMat[ this.SMat.length - 1 ].concat( r );
    }
  },
  
  adjustPMat: function( size )
  {
    this.adjustSMat( size );

    var o = [ 1 ], v = 0, P = this.PMat.length + 1;

    while ( this.PMat.length < size )
    {
      o = [ 1 ];

      for ( var i1 = 2; i1 <= P; i1++ ) { for ( var i2 = i1 - 1, v = Math.pow( i1, P ); i2 > 0; v -= Math.pow( i2, P ) * this.SMat[ i1 ][ i2 ], v = -v, i2-- ); if ( v < 0 ) { v = -v; } o[o.length] = v; }

      this.PMat[ this.PMat.length ] = new Array(); this.PMat[ this.PMat.length - 1 ] = this.PMat[ this.PMat.length - 1 ].concat( o ); P++;
    }
  },
  adjustCMat: function( size )
  {
    for ( var i1 = 0, sums = 1; i1 < size; sums *= ( i1++ ) + 1 )
    {
      if ( !this.CMat[ i1 ] ) { this.CMat[ i1 ] = [ sums ]; }

      for ( var i2 = this.CMat[ i1 ].length; i2 < size; i2++ ) { this.CMat[ i1 ][ i2 ] = this.CMat[ i1 ][ i2 - 1 ] * i1; }
    }

    this.CMat[ 0 ][ 0 ] = 0;
  },

  /***********************************************************************************
  Sum data across the cols of the matrix to Xn. Same as multiplying two vectors then adding each element across.
  ***********************************************************************************/

  sum: function( data, mat, D )
  {
    for ( var i = 0, sum = 0, l = Math.min( data.length, mat.length ); i < l; i++ )
    {
      if( D ) { this.debug += "(\"" + mat[i] + "\" * " + data[i] + "(Point" + i + "))"; }

      sum += ( data[i] || 0 ) * mat[ i ];

      if ( i < ( l - 1 ) && D ) { this.debug += "+"; }
    }
    
    return ( sum );
  },

  /***********************************************************************************
  Calculates sums stacked geometrically into an reduced set.
  ***********************************************************************************/

  D_Seq_G: function( s, el )
  {
    var o = [], s = s.slice( 0 ), sw = false; while ( el-- > 0 ) { s.shift(); };
    
    AI_Mat.debug += "<table border='1'><tr><td rowspan='"+(s.length+1)+"'>Row" + s.length + "</td></tr>";
    
    while ( s.length > 0 )
    {
      AI_Mat.debug += "<tr><td><center>";
      
      for ( var i = 0, l = s.length - 1; i < l; i++ )
      {
        AI_Mat.debug += ( s[ i + 1 ] + "" ).fontcolor( sw ? "#00AFFF" : "FF0000" ) + " - ";
        
        s[ i ] = s[ i + 1 ] - AI_Mat.sum( s, AI_Mat.SMat[ i ], true );
        
        AI_Mat.debug += " = " + ( s[ i ] + "" ).fontcolor( sw ? "FF0000" : "#00AFFF" ) + "(Point" + i + ")<br />";
      }
      
      sw = !sw;
      
      if( l === 0 ){ AI_Mat.debug += ( s[ 0 ] + "" ).fontcolor( sw ? "FF0000" : "#00AFFF" ) + "(Point0)"; }
      
      AI_Mat.debug += "</center></td><td>Data Point  = " + ( s[ 0 ] + "" ).fontcolor("#00FF00") + "(Point0)</td></tr>";
      
      o[ o.length ] = s[ 0 ]; s.pop();
    }
    
    AI_Mat.debug += "</table>";
    
    return ( o );
  },

  /***********************************************************************************
  Find smallest geo point stacked in sums.
  ***********************************************************************************/

  FindGeo: function( s ) { this.x = 0; this.y = 0;

    //The set that is geometrically closest to 0. The last number in the set before is the geo rise value before terminating.

    var i = s.length - 1;
    var out = AI_Mat.D_Seq_G(s, i);
    var temp = out.slice(0);
    
    var debug_data = [];

    while ( i > -1 && ( Math.abs( temp[ 0 ] | temp[ 1 ] ) !== 0 ) )
    {
      out = temp.slice( 0 ); i -= 1; temp = AI_Mat.D_Seq_G( s, i ).reverse();
      
      debug_data[ debug_data.length ] = out.slice(0);
    }
    
    debug_data[ debug_data.length ] = temp;
    
    //Show the layers in debug output.
    
    AI_Mat.debug += "<hr />"; AI_Mat.showMat( debug_data ); debug_data = undefined;

    //If we have not went though all dimensions without 0 terminating.

    if ( i !== -1 )
    {
      //The number of dimensions before 0 termination is the geo rise.

      this.y = out.length + 1;
      
      //Debug output.
      
      AI_Mat.debug += "<h2>Geo Sequence detected Row" + this.y + ".</h2><hr />Data Before zero termination = " + ( out + "" ).fontcolor("#00FF00");
      
      AI_Mat.debug += "<hr /><h2>Central Matrix.</h2><hr />"; AI_Mat.showMat( AI_Mat.CMat );

      //The central matrix is both expansion and sequence combined at the center.
      //Dividing by the rise and seq length will result in the geo size.

      this.x = out[ 0 ] / this.CMat[ this.y - 1 ][ s.length - this.y ];
      
      AI_Mat.debug += "<h2>Central Matrix alignment.</h2><hr /><h2>DataPoint0 / CMat[Row" + this.y + "-1][Data length - Row" + this.y + "] = " + this.x + "</h2>";
    }

    return ( this );
  },
  
  /***********************************************************************************
  Output the table of an matrix.
  ***********************************************************************************/
  
  showMat: function( Mat )
  {
    var ml = Mat.length;
    
    //Max col length.
    
    for( var i1 = 0, col = 1; i1 < Mat.length; col = Math.max( col, Mat[ i1++ ].length ) );
    
    //Debug output.

    for ( var i1 = 0; i1 < ml; i1++ )
    {
      AI_Mat.debug += "<div id=\"container\">\r\n";
      
      for ( var i2 = 0, i3 = 0, sp = col / Mat[ i1 ].length; Math.round( i2 ) < col; i2 += sp, i3++ )
      {
        AI_Mat.debug += "<div";
        
        if( sp === col ) { AI_Mat.debug += " style='position:relative;margin-left:-25px;left:50%;'"; }
        
        AI_Mat.debug += "><center>\"" + Mat[ i1 ][ i3 ] + "\"</center></div>\r\n";
      }

      AI_Mat.debug += "<span></span></div><hr />\r\n";
    }
  },
  
  /*****************************************************************************************
  This is an style script for debug mode.
  *****************************************************************************************/
  
  toString: function()
  {
    var t = this.debug; this.debug = "";
    
    return("<style>\
    #container\
    {\
      text-align: justify;\
      -ms-text-justify: distribute-all-lines;\
      text-justify: distribute-all-lines;\
      width:100%;\
    }\
    #container>div\
    {\
      min-width: 50px;\
      min-height: 50px;\
      vertical-align: top;\
      display: inline-block;\
      *display: inline;\
      zoom: 1;\
      border-style:solid;\
    }\
    span\
    {\
      width: 100%;\
      display: inline-block;\
      font-size: 0;\
      line-height: 0;\
    }\
    </style>" + t );
  }
};

/***********************************************************************************
An new set can be numbers per argument, or array of numbers, or set( string, radix ).
***********************************************************************************/

var Set = function( str, radix )
{
  var d = [];

  //Note base conversion does not happen If FL64 is not loaded.

  if ( str.constructor == String ) { d = str.replace(/(?:\r\n|\r|\n)/g,"").split(","); for ( var i = 0, radix = radix || 10; i < d.length; d[ i ] = parseFloat( d[ i++ ], radix ) ); }

  //Arrayed arguments.
  
  else { d = arguments.length > 1 ? Array.prototype.slice.call( arguments ) : arguments[ 0 ].slice ? arguments[ 0 ].slice( 0 ) : [ 0 ]; }

  //Set length.

  this.length = d.length;

  //Check if set is all numbers.

  for ( var i = 0; i < d.length; this[ i ] = d[ i++ ] ) { if ( isNaN( d[ i ] ) ) { throw ( new Error( "Improper set format." ) ); } }
}

/***********************************************************************************
Convert set to an geo/seq-sequence set.
***********************************************************************************/

Set.prototype.gen = function() {
  
  var SData = [], GData = [], g = { x: 0, y: 3 };
  
  for ( var i = 0; i < this.length; GData[ i++ ] = 0 );

  //Adjust the matrix as necessary for high performance.

  AI_Mat.adjustCMat( this.length );

  //Loop till there are no geometric points in set.

  while ( g.y > 2 )
  {
    //Compute the sequence.

    SData = this.seq( false ).seq;

    //Find Geometric point in sequence.
    
    AI_Mat.debug += "<hr /><h2>Geo sequence data.</h2><hr />" + ( SData + "" ).replace(/= /g,"= <font color=\"#FF0000\">").replace(/\r\n/g,"</font><br />") + "<hr />";
    
    g = AI_Mat.FindGeo( SData );

    //Record decoded point and remove it from set.

    if ( g.y >= 2 )
    {
      GData[ g.y ] = g.x; for ( var i = 0, l = this.length; i < l; this[ i ] -= Math.pow( g.y, i++ ) * g.x );

      if ( g.y === 2 ) { SData = this.seq( false ).seq; }
    }
  }

  //Return both data sets as decoded sets.

  var d = new DSet( SData, GData, true, false );

  //Geo set is automatically decoded.

  return ( d );
}

/***********************************************************************************
Convert set to an sequence set.
***********************************************************************************/

Set.prototype.seq = function( DSeq )
{
  var DSeq = typeof DSeq == "undefined" ? true : DSeq;

  //Adjust the matrix as necessary for high performance.

  AI_Mat.adjustSMat( this.length );
  
  //Debug output.

  AI_Mat.debug += "<hr /><h2>Sequence Matrix.</h2><hr />"; AI_Mat.showMat( AI_Mat.SMat );

  //Calculate Xn down the rows of the matrix summing the cols to calculate the next Xn value. High performance.

  for ( var i = 0, v = 0, l = this.length, SData = []; i < l; i++ )
  {
    AI_Mat.debug += ( this[ i ] + "" ).fontcolor("00AFFF"); if ( i !== 0 ) { AI_Mat.debug += " - "; }
    
    SData[ i ] = this[ i ] - AI_Mat.sum( SData, AI_Mat.SMat[ i ], true );
    
    AI_Mat.debug += " = " + SData[ i ] + " &divide; \"" + AI_Mat.SMat[ i ][ i ] + "\" = ";
    
    SData[ i ] /= AI_Mat.SMat[ i ][ i ];
    
    AI_Mat.debug += ( SData[ i ] + "" ).fontcolor("FF0000") + "(Point" + i + ")<br /><br />";
  }

  //Return Sequenced values.

  return ( new DSet( SData, [ 0 ], DSeq, false ) );
};

/***********************************************************************************
Convert set to an geo-sequence set.
***********************************************************************************/

Set.prototype.geo = function( DGeo )
{
  var DGeo = typeof DGeo == "undefined" ? true : DGeo;

  //Adjust the matrix as necessary for high performance.

  AI_Mat.adjustPMat( this.length );
  
  //Debug output.

  AI_Mat.debug += "<hr /><h2>Sequence Matrix.</h2><hr />"; AI_Mat.showMat( AI_Mat.PMat );
  
  //Calculate Xn down the rows of the matrix summing the cols to calculate the next Xn value. High performance.

  for ( var i = 0, v = 0, l = this.length, PData = []; i < l; i++ )
  {
    AI_Mat.debug += ( this[ i ] + "" ).fontcolor("00AFFF"); if ( i !== 0 ) { AI_Mat.debug += " - "; }
    
    PData[ i ] = this[ i ] - AI_Mat.sum( PData, AI_Mat.PMat[ i ], true );
    
    AI_Mat.debug += " = " + PData[ i ] + " &divide; \"" + AI_Mat.PMat[ i ][ i ] + "\" = ";
    
    PData[ i ] /= AI_Mat.PMat[ i ][ i ];
    
    AI_Mat.debug += ( PData[ i ] + "" ).fontcolor("FF0000") + "(Point" + i + ")<br /><br />";
  }

  //Return Sequenced values.

  return ( new DSet( [ 0 ], PData, false, DGeo ) );
}

/***********************************************************************************
Set to string.
***********************************************************************************/

Set.prototype.toString = function( radix ) { for ( var i = 0, str = ""; i < this.length; str += "X" + i + " = " + this[ i++ ].toString( radix ) + "\r\n" ); return ( str ); }

/***********************************************************************************
DSet is the decoding of Seq, or Geo, or both. Takes two sets. The first set can be 0 if not used.
***********************************************************************************/

//Create two new sets that are in point format that are to be decoded.

function DSet( seq, geo, DSeq, DGeo )
{
  this.seq = new Set( seq || [ 0 ] ); this.geo = new Set( geo || [ 0 ] );

  //Decode Senescence data.

  AI_Mat.adjustPMat( this.seq.length + 1 );

  if ( DSeq )
  {
    AI_Mat.debug += "<hr /><h2>Data</h2><hr />" + ( this.seq + "" ).replace(/= /g,"= <font color=\"#FF0000\">").replace(/\r\n/g,"</font><br />") + "<hr /><h2>Decode Matrix.</h2><hr />";
    
    AI_Mat.showMat( AI_Mat.PMat );
    
    AI_Mat.debug += "<table border ='1px;'>";
    
    for ( var i = this.seq.length - 1; i > 0; i-- )
    {
      if ( this.seq[ i ] !== 0 )
      {
        AI_Mat.debug += "<tr><td colspan='2' ><center><h2>Data Point" + i + ".</h2></center></td></tr>"
        
        AI_Mat.debug += "<tr><td>Remaining data length vect:</td><td>" + ( Array.from( this.seq ).splice(0, i + 1 ) + "" ).fontcolor( "#FF0000" ) + "</td><tr>";
        AI_Mat.debug += "<tr><td>Mat row to remaining data length vect:</td><td>" + AI_Mat.PMat[ i - 1 ] + "</td></tr>";
        AI_Mat.debug += "<tr><td>Last col divided by last value in vect is data Point size:</td><td>" + ( this.seq[ i ] + "" ).fontcolor("#FF0000") + " / ";
        
        this.seq[ i ] /= AI_Mat.PMat[ i - 1 ][ i - 1 ];
        
        AI_Mat.debug += AI_Mat.PMat[ i - 1 ][ i - 1 ] + " = " + ( this.seq[ i ] + "" ).fontcolor("#00FF00") + "(Data Point)</td></tr>";

        AI_Mat.debug += "<tr><td>Subtract data by mat row vect:</td><td>(" + ( Array.from( this.seq ).splice(0, i + 1 ) + "" ).fontcolor( "#FF0000" ) + ") - (" + AI_Mat.PMat[ i - 1 ] + ") * " + ( this.seq[ i ] + "" ).fontcolor("#00FF00") + "(Data Point)</td></tr>";
        
        for ( var i2 = i - 1; i2 > 0; i2-- )
        {
          this.seq[ i2 ] -= this.seq[ i ] * AI_Mat.PMat[ i - 1 ][ i2 - 1 ];
        }
      }
    }
    
    AI_Mat.debug += "<tr><td colspan='2' ><center><h2>Data Point0.</h2></center></td></tr>"
    AI_Mat.debug += "<tr><td>Remaining point.</td><td>" + ( this.seq[ 0 ] + "" ).fontcolor("#00FF00") + "(Data Point)</td></tr>";
    
    AI_Mat.debug += "</table>";
  }

  //Decode Geo sequence data.

  if ( DGeo )
  {
    AI_Mat.debug += "<hr /><h2>Data</h2><hr />" + ( this.geo + "" ).replace(/= /g,"= <font color=\"#FF0000\">").replace(/\r\n/g,"</font><br />") + "<hr /><h2>Decode Matrix.</h2><hr />";
    
    AI_Mat.showMat( AI_Mat.SMat );
    
    AI_Mat.debug += "<table border ='1px;'>";
    
    for ( var i = this.geo.length - 1; i > -1; i-- )
    {
      if ( this.geo[ i ] !== 0 )
      {
        AI_Mat.debug += "<tr><td colspan='2' ><center><h2>Data Point" + i + ".</h2></center></td></tr>"
        
        AI_Mat.debug += "<tr><td>Remaining data length vect:</td><td>" + ( Array.from( this.geo ).splice(0, i + 1 ) + "" ).fontcolor( "#FF0000" ) + "</td><tr>";
        AI_Mat.debug += "<tr><td>Mat row to remaining data length vect:</td><td>" + AI_Mat.SMat[ i + 1 ] + "</td></tr>";
        AI_Mat.debug += "<tr><td>Last col divided by last value in vect is data Point size:</td><td>" + ( this.geo[ i ] + "" ).fontcolor("#FF0000") + " / ";
        
        this.geo[ i ] /= AI_Mat.SMat[ i + 1 ][ i + 1 ];
        
        AI_Mat.debug += AI_Mat.SMat[ i + 1 ][ i + 1 ] + " = " + ( this.geo[ i ] + "" ).fontcolor("#00FF00") + "(Data Point)</td></tr>";
        AI_Mat.debug += "<tr><td>Subtract data by mat row vect:</td><td>(" + ( Array.from( this.geo ).splice(0, i + 1 ) + "" ).fontcolor( "#FF0000" ) + ") - (" + AI_Mat.SMat[ i + 1 ] + ") * " + ( this.geo[ i ] + "" ).fontcolor("#00FF00") + "(Data Point)</td></tr>";
        
        for ( var i2 = i - 1; i2 > -1; i2-- )
        {
          this.geo[ i2 ] -= this.geo[ i ] * AI_Mat.SMat[ i + 1 ][ i2 + 1 ];
        }
      }
    }
    
    AI_Mat.debug += "</table>";
    
    this.geo.unshift(0);
  }

}

/***********************************************************************************
Filter out error in geo and seq data.
***********************************************************************************/

DSet.prototype.filter = function()
{  
  //For general use convert to best average faction if FL64 is loaded.

  if ( Number.prototype.avgFract ) { this.seq = this.seq.avgFract(); this.geo = this.geo.avgFract(); }
}

/***********************************************************************************
Convert pat to math string.
***********************************************************************************/

DSet.prototype.toString = function()
{
  //Convert sets to an function. Use FL64 correction if loaded.

  this.filter();

  //Construct Sequence data into code.

  var code = "", f = "", sw = false, init = false, d = this.seq;

  for ( var i = 0; i < d.length || !sw; i++ )
  {
    if ( i === d.length ) { sw = true; d = this.geo; i = 0; }
    
    if ( d[ i ].valueOf() !== 0 )
    {
      if( init ){ code += d[ i ] < 0 ? "-" : "+"; f = d[ i ].toString( "*", true ); } else { f = d[ i ].toString( i < 1 ? "" : "*", i < 1  ); init = true; }
      
      if( i > 1 ) { code += !sw ? "X^" + i : i + "^X"; } else if( i === 1 ) { code += "X"; }
      
      code += f;
    }
  }

  return ( code.replace( / /g, "" ) );
}

/***********************************************************************************
Return an function of the solved data.
***********************************************************************************/

DSet.prototype.getFunc = function()
{
  //Convert sets to an function.

  this.filter();

  //If function had been initialized.

  var init = false, d = this.seq, sw = false;

  //Construct Sequence data into code.

  var code = "var f = function( x )\r\n{\r\n";

  for ( var i = 0; i < d.length || !sw; i++ )
  {
    if ( i === d.length ) { sw = true; d = this.geo; i = 0; }

    if ( d[ i ].valueOf() !== 0 )
    {
      if ( !init ) { code += "  var o = "; init = true; } else { if ( d[ i ] < 0 ) { code += "  o -= "; } else { code += "  o += "; } }

      if ( i > 1 ) { code += String.toExp( "x", i, sw ) + d[ i ].toString("*", true); }
      
      else { code += ( !sw && i === 1 ) ? "x " + d[ 1 ].toString("*", true) : d[ i ].toString("", false); }

      code += ";\r\n";
    }
  }
  
  eval( code += "  return( o );\r\n};" ); return ( f );
}

/***********************************************************************************
HTML format function for browsers that do not support the formating for debug output.
***********************************************************************************/

if( !String.prototype.fontcolor ) { String.prototype.fontcolor = function( c ) { return( "<font color=\"" + c + "\">" + this + "</font>" ); } }

/***********************************************************************************
An simplistic forum for number to string with an combined operation for code generation if FL64 is not loaded.
***********************************************************************************/

if( !Number.prototype.getFract ) { Number.prototype.toString = function( v, s ) { var o = this; if ( s && o < 0 ) { o = -o; } return ( ( v ? v + " " : "" ) + o + "" ); } }

/***********************************************************************************
Another simplistic forum for exponential function to code.
***********************************************************************************/

String.toExp = function( s1, s2, Order ) { Order && ( s2 = [ s1, s1 = s2 ][ 0 ] ); return( AI_Mat.Exp ? s1 + " ** " + s2 + " " : "Math.pow( " + s1 + ", " + s2 + ") " ); };

/***********************************************************************************
Array.from compatibility to older web browsers.
***********************************************************************************/

if ( !Array.from ) { Array.from = function( s ) { var a = []; for ( var i = 0; i < s.length; a[ i ] = s[ i++ ] ); return ( a ); } }

/***********************************************************************************
Inherit operations from Arrays, and FL64 library if loaded otherwise functions do not exist when called on data type set.
***********************************************************************************/

for (var i = 0, a = ["reverse", "splice", "slice", "divP", "reduce", "valueOf", "getFract", "avgFract", "bits", "bitAnd", "bitOr", "bitXor", "bitNot", "bitRsh", "bitLsh", "toPattern", "err"], c = ""; i < a.length; i++)
{ c += "Set.prototype." + a[i] + " = function( arg ) { return( Array.prototype." + a[i] + " ? new Set( Array.from( this )." + a[i] + "( arg ) ) : this ); };\r\n"; }
for (var i = 0, a = ["shift", "unshift", "push", "pop"]; i < a.length; i++) { c += "Set.prototype." + a[i] + " = Array.prototype." + a[i] + ";\r\n"; }
eval( c ); c = undefined; i = undefined; a = undefined;
