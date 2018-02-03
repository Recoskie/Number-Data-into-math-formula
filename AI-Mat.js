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
  Enable, or disable error correction.
  ***********************************************************************************/
  
  ErrCorrect: false,

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

  sum: function( data, mat ) { for ( var i = 0, sum = 0, l = Math.min( data.length, mat.length ); i < l; sum += ( data[i] || 0 ) * mat[ i ], i++ ); return ( sum ); },

  /***********************************************************************************
  Calculates sums stacked geometrically into an reduced set.
  ***********************************************************************************/

  D_Seq_G: function( s, el ) { var o = [], s = s.slice( 0 ); while ( el-- > 0 ) { s.shift(); }; while ( s.length > 0 ) { for ( var i = 0, l = s.length - 1; i < l; i++ ) { s[ i ] = s[ i + 1 ] - AI_Mat.sum( s, AI_Mat.SMat[ i ] ); }; o[ o.length ] = s[ 0 ]; s.pop(); }; return ( o ); },

  /***********************************************************************************
  Find smallest geo point stacked in sums.
  ***********************************************************************************/

  FindGeo: function( s ) { this.x = 0; this.y = 0;

    //The set that is geometrically closest to 0. The last number in the set before is the geo rise value before terminating.

    var i = s.length - 1;
    var out = AI_Mat.D_Seq_G(s, i);
    var temp = out.slice(0);

    while ( i > -1 && ( Math.abs( temp[ 0 ] | temp[ 1 ] ) !== 0 ) ) { out = temp.slice( 0 ); i -= 1; temp = AI_Mat.D_Seq_G( s, i ).reverse(); }

    //If we have not went though all dimensions without 0 terminating.

    if ( i !== -1 )
    {
      //The number of dimensions before 0 termination is the geo rise.

      this.y = out.length + 1;

      //The central matrix is both expansion and sequence combined at the center.
      //Dividing by the rise and seq length will result in the geo size.

      this.x = out[ 0 ] / this.CMat[ this.y - 1 ][ s.length - this.y ];
    }

    return ( this );
  },
  
  /***********************************************************************************
  Debug output not supported.
  ***********************************************************************************/
  
  toString: function() { return(""); }
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

  //Calculate Xn down the rows of the matrix summing the cols to calculate the next Xn value. High performance.

  for ( var i = 0, v = 0, l = this.length, SData = []; i < l; SData[ i ] = ( this[ i ] - AI_Mat.sum( SData, AI_Mat.SMat[ i ] ) ) / AI_Mat.SMat[ i ][ i ], i++ );

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

  //Calculate Xn down the rows of the matrix summing the cols to calculate the next Xn value. High performance.

  for ( var i = 0, v = 0, l = this.length, PData = []; i < l; PData[ i ] = ( this[ i ] - AI_Mat.sum( PData, AI_Mat.PMat[ i ] ) ) / AI_Mat.PMat[ i ][ i ], i++ );

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

  if ( DSeq ) { for ( var i = this.seq.length - 1; i > 1; i-- ) { if ( this.seq[ i ] !== 0 ) { this.seq[ i ] /= AI_Mat.PMat[ i - 1 ][ i - 1 ]; for ( var i2 = i - 1; i2 > 0; i2-- ) { this.seq[ i2 ] -= this.seq[ i ] * AI_Mat.PMat[ i - 1 ][ i2 - 1 ]; } } } }

  //Decode Geo sequence data.

  if ( DGeo ) { for ( var i = this.geo.length - 1; i > -1; i-- ) { if ( this.geo[ i ] !== 0 ) { this.geo[ i ] /= AI_Mat.SMat[ i + 1 ][ i + 1 ]; for ( var i2 = i - 1; i2 > -1; i2-- ) { this.geo[ i2 ] -= this.geo[ i ] * AI_Mat.SMat[ i + 1 ][ i2 + 1 ]; } } } this.geo.unshift(0); }

  //Is not filtered. Set already filtered if error correction is disabled.
  
  this.isFiltered = !AI_Mat.ErrCorrect;
}

/***********************************************************************************
Filter out error in geo and seq data.
***********************************************************************************/

DSet.prototype.filter = function()
{
  //EPSILON Filter.
  
  if( !this.isFiltered )
  {
    this.isFiltered = true;
    
    //Calculate the log data of each term.
    
    for( var i = 0, l = []; i < this.seq.length; l[i] = ( ( Math.log( Math.abs( this.seq[i++] ) ) / 0.6931471805599453 ) + 0.5 ) & -1 );
    for( var i = 0; i < this.geo.length; l[l.length] = ( ( Math.log( Math.abs( this.geo[i++] ) ) / 0.6931471805599453 ) + 0.5 ) & -1 );
    
    //Remove terms outside of data.
    
    for( var i = 0, avg = 0; i < l.length; avg += l[i++] ); avg /= l.length; for( i = 0; i < l.length; i++ )
    {
      if( l[i] < avg && l[i] < 0 ) { if( i < this.seq.length ) { this.seq[ i ] = 0; } else { this.geo[ i - this.seq.length ] = 0; } }
    }
    
    //Dynamic epsilon error correction if Remaining data is to be converted to very close exact fractions.
    
    if ( Number.prototype.getFract )
    { 
      for( var i = this.seq.length - 1, err = Math.pow( 2, ( Math.abs( avg ) ) ); i > -1; err += Math.pow( 2, Math.abs( avg ) + ( i-- ) ) )
      {
        this.seq[i] = ( this.seq[ i ] + 0 ).getFract( err );
      }
      for( var i = this.geo.length - 1, err = Math.pow( 2, ( Math.abs( avg ) ) ); i > -1; err += Math.pow( 2, Math.abs( avg ) + ( i-- ) ) )
      {
        this.geo[i] = ( this.geo[ i ] + 0 ).getFract( err );
      }
    }
  }
  
  //For general use convert to best average faction if FL64 is loaded.

  else if ( Number.prototype.avgFract ) { this.seq = this.seq.avgFract(); this.geo = this.geo.avgFract(); }
}

/***********************************************************************************
Convert pat to math string.
***********************************************************************************/

DSet.prototype.toString = function()
{
  //Convert sets to an function.

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
