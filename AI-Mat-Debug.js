/***********************************************************************************
The matrices that act as the brain.
***********************************************************************************/

var AI_Mat = {

  /***********************************************************************************
  Two main matrices that are adjusted for faster decoding and encoding alignment of dimensions.
  ***********************************************************************************/

  SMat: [], PMat: [],

  /***********************************************************************************
  Enable, or disable error correction.
  ***********************************************************************************/

  ErrCorrect: false,

  /***********************************************************************************
  Operator check for when creating functions. Not all operators are supported by all web browsers.
  ***********************************************************************************/

  Exp: ( function() { try { eval( "0 ** 0" ); return ( true ); } catch ( e ) { return ( false ); } } )(),

  /***********************************************************************************
  Adjust two main matrices as necessary.
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

      for ( var i1 = 2; i1 <= P; i1++ )
      {
        for ( var i2 = i1 - 1, v = Math.pow( i1, P ); i2 > 0; v -= Math.pow( i2, P ) * this.SMat[ i1 ][ i2 ], v = -v, i2-- );
        if ( v < 0 ) { v = -v; } o[ o.length ] = v;
      }

      this.PMat[ this.PMat.length ] = new Array();
      this.PMat[ this.PMat.length - 1 ] = this.PMat[ this.PMat.length - 1 ].concat( o );
      
      P++;
    }
  },

  /***********************************************************************************
  Compile an matrix to be sequenced into code for faster performance.
  ***********************************************************************************/

  MkS: function( array, mat, phase )
  {
    var o = "", data = [], v = 0, phase = ( phase & 1 ) || 0;

    for ( var i1 = 0; i1 < mat.length; i1++ )
    {
      data = mat[ i1 ]; o += "  " + array + "[" + ( i1 + phase ) + "] = ";

      o += ( data[ i1 ] !== 1 ? "( " : "") + ( ( i1 + phase ) !== 0 ? array + "[" + ( i1 + phase ) + "] - " + ( ( data.length + phase ) > 2 ? "(" : "" ) : array + "[0]" );

      for ( var i2 = -phase; i2 < data.length - 1; i2++ )
      {
        v = data[ i2 ] || 0; ( phase ) && ( v += data[ i2 + 1 ] || 0 );
        o += " " + array + "[" + ( i2 + phase ) + "]" + ( ( v !== 1 ) ? " * " + v : "" ) + ( ( i2 < data.length - 2 ) ? " +" : "" );
      }

      o += ( ( ( data.length + phase ) > 2 ? " )" : "" ) ) + ( ( data[ i1 ] !== 1 ) ? " ) / " + data[ i2 ] : "" );
      
      o += ";\r\n";
    }

    return ( o );
  },

  /***********************************************************************************
  Compile an spiral decode for sequenced matrix.
  ***********************************************************************************/
  
  MkSp: function( n, size )
  {
    if( size-- <= 1 ) { return( "" ); }

    var o = " var sp1 = " + n + "[" + ( size - 1 ) + "], sp2 = " + n + "[" + size + "];\r\n";

    for( var i = size; i > 1; o += " " + n + "[" + i-- + "] -= sp2; sp2 = ( sp1 += sp2 ) - sp2;\r\n" );

    o += " " + n + "[1] -= sp2; " + n + "[0] -= sp1;"; return ( o );
  },

  /***********************************************************************************
  Compile an matrix into an be-sequenced code for faster performance.
  ***********************************************************************************/

  MkD: function( array, mat, phase )
  {
    var o = "", data = [], v = 0, phase = ( phase & 1 ) || 0;

    for ( var i1 = mat.length - 1; i1 >= 0; i1-- )
    {
      data = mat[ i1 ]; o += " "; if ( data[ i1 ] !== 1 ) { o += " " + array + "[" + ( i1 + phase ) + "] = " + array + "[" + ( i1 + phase ) + "] / " + data[ i1 ] + ";"; }

      for ( var i2 = data.length - 2; i2 >= -phase; i2-- )
      {
        v = data[i2] || 0; ( phase ) && ( v += data[ i2 + 1 ] || 0 );
        o += " " + array + "[" + ( i2 + phase ) + "] -= " + array + "[" + ( i1 + phase ) + "]" + ( ( v !== 1 ) ? " * " + v : "") + ";";
      }

      o += "\r\n";
    }

    return ( o );
  },

  /***********************************************************************************
  Pre compiled sequencing functions.
  ***********************************************************************************/

  Seq: [], SGeq: [], Geq: [],
  SeqSp: [], SGeqSp: [], GeqSp: [],

  /***********************************************************************************
  Output the table of an matrix.
  ***********************************************************************************/

  showMat: function( Mat )
  {
    var ml = Mat.length;

    //Max col length.

    for ( var i1 = 0, col = 1; i1 < Mat.length; col = Math.max( col, Mat[ i1++ ].length ) );

    //Debug output.

    for (var i1 = 0; i1 < ml; i1++)
    {
      AI_Mat.debug += "<div id=\"container\">\r\n";

      for ( var i2 = 0, i3 = 0, sp = col / Mat[ i1 ].length; Math.round( i2 ) < col; i2 += sp, i3++ )
      {
        AI_Mat.debug += "<div";

        if ( sp === col )
        {
          AI_Mat.debug += " style='position:relative;margin-left:-25px;left:50%;'";
        }

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

    return ( "<style>\
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
Setup an few Basic sequence functions.
***********************************************************************************/

AI_Mat.SGeqSp[ 0 ] = function( s ) { return ( new DSet( [ 0 ], [ 0 ], [ 0, 0 ] ) ); };
AI_Mat.SGeqSp[ 1 ] = function( s ) { var s = s.slice( 0 ); return ( new DSet( s, [ 0 ], [ 0, 0 ] ) ); };

AI_Mat.SGeq[ 0 ] = function( s ) { return ( new DSet( [ 0 ], [ 0 ], [ 0, 0 ] ) ); };
AI_Mat.SGeq[ 1 ] = function( s ) { var s = s.slice( 0 ); return ( new DSet( s, [ 0 ], [ 0, 0 ] ) ); };
AI_Mat.SGeq[ 2 ] = function( s ) { var s = s.slice( 0 ); s[ 1 ] = s[ 1 ] - s[ 0 ]; s[ 0 ] -= s[ 1 ]; return ( new DSet( s, [ 0 ], [ 0, 0 ] ) ); }

AI_Mat.SeqSp[ 0 ] = function( s ) { return ( new DSet( [ 0 ], [ 0 ], [ 0, 0 ] ) ); };
AI_Mat.SeqSp[ 1 ] = function( s ) { var s = s.slice( 0 ); return ( new DSet( s, [ 0 ], [ 0, 0 ] ) ); };

AI_Mat.GeqSp[ 0 ] = function( s ) { return ( new DSet( [ 0 ], [ 0 ], [ 0, 0 ] ) ); };
AI_Mat.GeqSp[ 1 ] = function( s ) { var s = s.slice( 0 ); return ( new DSet( [ 0 ], s, [ 0, 0 ] ) ); };

/***********************************************************************************
An new set can be numbers per argument, or array of numbers, or set( string, radix ).
***********************************************************************************/

var set = function( str, radix )
{
  var d = [];

  //Note base conversion does not happen If FL64 is not loaded.

  if ( str.constructor == String )
  {
    d = str.replace( /(?:\r\n|\r|\n)/g, "" ).split( "," ); for ( var i = 0, radix = radix || 10; i < d.length; d[ i ] = parseFloat( d[ i++ ], radix ) );
  }

  //Arrayed arguments.
  
  else { d = arguments.length > 1 ? Array.prototype.slice.call( arguments ) : arguments[ 0 ].slice ? arguments[ 0 ].slice( 0 ) : [ 0 ]; }

  //Set length.

  this.length = d.length;

  //Check if set is all numbers.

  for ( var i = 0; i < d.length; this[ i ] = d[ i++ ] ) { if ( isNaN( d[ i ] ) ) { throw ( new Error( "Improper set format." ) ); } }
}

/***********************************************************************************
Decode all dimensional sequences along set.
***********************************************************************************/

set.prototype.seq = function()
{
  //Adjust the matrix as necessary.

  AI_Mat.adjustSMat( this.length ); AI_Mat.adjustPMat( this.length );

  //Debug output.

  AI_Mat.debug += "<hr /><h2>Current Sequence Matrix.</h2><hr />"; AI_Mat.showMat( AI_Mat.SMat );
  AI_Mat.debug += "<hr /><h2>Current Alingment Matrix.</h2><hr />"; AI_Mat.showMat( AI_Mat.PMat );

  //Run Sequence function.

  var t = 0; if ( t = AI_Mat.Seq[ this.length ] ) { AI_Mat.debug += "<hr /><h2>Using Sequence function.</h2><hr />" + t.toString().html() + ""; t = t( this ); }

  //Else setup function for first time use.
  
  else
  {
    //Create function.

    eval( "AI_Mat.Seq[ " + this.length + " ] = function( s )\r\n{\r\n  var s = s.slice( 0 );\r\n\r\n\
	" + AI_Mat.MkS( "s", AI_Mat.SMat.slice( 0, this.length ), false ) + "\r\n\
	" + AI_Mat.MkD( "s", AI_Mat.PMat.slice( 0, this.length - 1 ), true ) + "\r\n\
	  return( new DSet( s, [ 0 ], [ 0, 0 ] ) );\r\n}" );

    AI_Mat.debug += "<hr /><h2>Using Compiled function.</h2><hr />" + AI_Mat.Seq[ this.length ].toString().html() + "";

    //Call function.

    t = AI_Mat.Seq[ this.length ]( this );
  }

  AI_Mat.debug += "<hr /><h4>Note that you can copy the de-Sequence function code if you wish to use it in any project.</h4><hr />";

  //Return Sequenced values.

  return ( t );
};

/***********************************************************************************
Decode all dimensional sequences along set plus spiral.
***********************************************************************************/

set.prototype.seqsp = function()
{
  //Adjust the matrix as necessary.

  AI_Mat.adjustSMat( this.length ); AI_Mat.adjustPMat( this.length );

  //Debug output.

  AI_Mat.debug += "<hr /><h2>Current Sequence Matrix.</h2><hr />"; AI_Mat.showMat( AI_Mat.SMat );
  AI_Mat.debug += "<hr /><h2>Current Alingment Matrix.</h2><hr />"; AI_Mat.showMat( AI_Mat.PMat );

  //Run Sequence function.

  var t = 0; if ( t = AI_Mat.SeqSp[ this.length ] ) { AI_Mat.debug += "<hr /><h2>Using Sequence function.</h2><hr />" + t.toString().html() + ""; t = t( this ); }

  //Else setup function for first time use.
  
  else
  {
    //Create function.

    eval( "AI_Mat.SeqSp[ " + this.length + " ] = function( s )\r\n{\r\n  var s = s.slice( 0 );\r\n\r\n\
	" + AI_Mat.MkS( "s", AI_Mat.SMat.slice( 0, this.length ), false ) + "\r\n\
  " + AI_Mat.MkSp( "s", this.length ) + "\r\n\r\n\
	" + AI_Mat.MkD( "s", AI_Mat.PMat.slice( 0, this.length - 3 ), true ) + "\r\n\
	  return( new DSet( s, [ 0 ], [ sp1, sp2 ] ) );\r\n}" );

    AI_Mat.debug += "<hr /><h2>Using Compiled function.</h2><hr />" + AI_Mat.SeqSp[ this.length ].toString().html() + "";

    //Call function.

    t = AI_Mat.SeqSp[ this.length ]( this );
  }

  AI_Mat.debug += "<hr /><h4>Note that you can copy the de-Sequence function code if you wish to use it in any project.</h4><hr />";

  //Return Sequenced values.

  return ( t );
};

/***********************************************************************************
Decode all dimensional sequences, and geo expansion along set.
***********************************************************************************/

set.prototype.gen = function( set )
{
  //Adjust the matrix as necessary.

  AI_Mat.adjustSMat( this.length ); AI_Mat.adjustPMat( this.length );

  //Debug output.

  AI_Mat.debug += "<hr /><h2>Current Sequence^Alignment Matrix.</h2><hr />"; AI_Mat.showMat( AI_Mat.SMat );
  AI_Mat.debug += "<hr /><h2>Current Alingment^Sequence Matrix.</h2><hr />"; AI_Mat.showMat( AI_Mat.PMat );

  //Run Sequence function.

  var t = 0; if ( t = AI_Mat.SGeq[ this.length ] ) { AI_Mat.debug += "<hr /><h2>Using Sequence function.</h2><hr />" + t.toString().html() + ""; t = t( this ); }

  //Else setup function for first time use.
  
  else
  {
    //Center align.

    var c1 = Math.floor( this.length / 2 );
    var c2 = this.length - c1;

    //Create function.

    var f = "AI_Mat.SGeq[ " + this.length + " ] = function( s )\r\n{\r\n  var s = s.slice( 0 );\r\n\r\n";
    f += AI_Mat.MkS( "s", AI_Mat.SMat.slice( 0, this.length ), false ) + "\r\n  ";
    f += "var g = s.slice( " + ( c1 + 1 ) + ", " + this.length + " ); s.length = " + ( c1 + 1 ) + "; s = s.slice( 0, " + ( c1 + 1 ) + " );\r\n\r\n";
    f += AI_Mat.MkS( "g", AI_Mat.PMat.slice( 0, c2 - 2 ), true ) + "\r\n";
    f += AI_Mat.MkD( "g", AI_Mat.SMat.slice( 0, c2 - 1 ), false ) + "  ";

    for ( var i1 = 1; i1 < c2 - 1; f += "g[" + i1 + "] /= " + Math.pow( i1 + 1, c1 + 1 ) + "; ", i1++ ); f += "\r\n";

    for ( var i1 = 0; i1 < c1 + 1; i1++ )
    {
      f += "  s[" + i1 + "] -= ";

      for ( var i2 = 0; i2 < c2 - 1; i2++ )
      {
        f += "g[" + i2 + "]" + ( ( Math.pow( i2 + 1, i1 ) !== 1 ) ? " * " + Math.pow( i2 + 1, i1 ) : "") + ( ( i2 < c2 - 2 ) ? " + " : "" );
      }

      f += ";\r\n";
    }

    f += "\r\n  g.unshift( s.shift() );\r\n\r\n";

    f += AI_Mat.MkD( "s", AI_Mat.PMat.slice( 0, c1 ) );

    f += "   s.unshift( 0 ); g.unshift( 0 ); return( new DSet( s, g, [ 0, 0 ] ) );\r\n};";

    eval(f); f = null; c1 = null; c2 = null;

    AI_Mat.debug += "<hr /><h2>Using Compiled function.</h2><hr />" + AI_Mat.SGeq[ this.length ].toString().html() + "";

    //Call function.

    t = AI_Mat.SGeq[ this.length ]( this );
  }

  AI_Mat.debug += "<hr /><h4>Note that you can copy the de-sequence function code if you wish to use it in any project.</h4><hr />";

  //Return Sequenced values.

  return ( t );
}

/***********************************************************************************
Decode all dimensional sequences, and geo expansion along set plus spiral.
***********************************************************************************/

set.prototype.gensp = function()
{
  //Adjust the matrix as necessary.

  AI_Mat.adjustSMat( this.length ); AI_Mat.adjustPMat( this.length );
  
  //Debug output.

  AI_Mat.debug += "<hr /><h2>Current Sequence^Alignment Matrix.</h2><hr />"; AI_Mat.showMat( AI_Mat.SMat );
  AI_Mat.debug += "<hr /><h2>Current Alingment^Sequence Matrix.</h2><hr />"; AI_Mat.showMat( AI_Mat.PMat );
  
  //Run Sequence function.
  
  if ( t = AI_Mat.SGeqSp[ this.length ] ) { AI_Mat.debug += "<hr /><h2>Using Sequence function.</h2><hr />" + t.toString().html() + ""; t = t( this ); }

  //Else setup function for first time use.
  
  else
  {
    //Center align.

    var c1 = Math.floor( ( this.length - 2 ) / 2 ); //Seq split.
    var c2 = this.length - c1; //Geo split.

    var code = "AI_Mat.SGeqSp[ " + this.length + " ] = function( s )\r\n{\r\n  var s = s.slice( 0 );\r\n\r\n";
    
    //Top spiral.

    for( var i = 0; i < this.length - 2; code += "  s[" + i + "] = s[" + ( i + 2 ) + "] - ( s[" + i + "] + s[" + ( i + 1 ) + "] );\r\n", i++ ); code += "\r\n";
    
    code += AI_Mat.MkS( "s", AI_Mat.SMat.slice( 0, this.length - 2 ), false ) + "\r\n";

    //create the two sets between center alignment.

    code += "  var sp1 = s[" + ( this.length - 2 ) + "], sp2 = s[" + ( this.length - 1 ) + "], g = []; s.length = " + ( this.length - 2 ) + "; g = s.slice( " + ( c1 + 1 ) + ", " + ( this.length - 2 ) + " ); s.length = " + ( c1 + 1 ) + "; s = s.slice( 0, " + ( c1 + 1 ) + " );\r\n\r\n";

    //Decode geo

    if( ( c2 - 3 ) > 0 )
    {
      code += AI_Mat.MkS( "g", AI_Mat.PMat.slice( 0, c2 - 4 ), true ) + "\r\n";

      //Adjust geo decode matrix.

      for (var i1 = 0, c = 1, b = 4, SMatSp = []; i1 < c2 - 3; c += b, b += 2, i1++)
      {
        SMatSp[i1] = []; for (var i2 = 0; i2 < AI_Mat.SMat[i1].length; SMatSp[i1][i2] = AI_Mat.SMat[i1][i2] * c * Math.pow(i1 + 1, c1 + 1), i2++);
      }

      var temp = AI_Mat.MkD( "g", SMatSp, false ); for( var i = 0, i2 = c2 - 4, s = temp.split( "\r\n" ), temp = ""; i < c2 - 3; i++, i2-- )
      {
        temp += s[ i ] + " sp1 -= g[" + i2 + "] * " + Math.pow( i2 + 2, this.length - 2 ) + "; sp2 -= g[" + i2 + "] * " + Math.pow( i2 + 2, this.length - 1 ) + ";\r\n";
      }
      
      code += temp + "\r\n"; temp = "";

      //Remove geo from seq.

      for ( var i1 = 0; i1 < c1 + 1; i1++ )
      {
        code += "  s[" + i1 + "] -= ";

        for ( var i2 = 0, c = 1, b = 4; i2 < c2 - 3; i2++, c += b, b += 2 )
        {
          code += "g[" + i2 + "]" + ( ( Math.pow( i2 + 1, i1 ) * c !== 1 ) ? " * " + Math.pow( i2 + 1, i1 ) * c : "") + ( ( i2 < c2 - 4 ) ? " + " : "" );
        }

        code += ";\r\n";
      }

      code += "\r\n";
    }

    //Adjust Seq decode matrix.

    for( var i1 = 0, PMatSp = [ [ -1 ] ]; i1 < c1; i1++ )
    {
      PMatSp[ i1 + 1 ] = [];
      for( var i2 = 0; i2 < AI_Mat.PMat[ i1 ].length; i2++ )
      {
        PMatSp[ i1 + 1 ][ i2 ] = ( AI_Mat.PMat[ i1 ][ i2 + 2 ] || 0 ) + ( ( AI_Mat.PMat[ i1 ][ i2 + 1 ] || 0 ) - AI_Mat.PMat[ i1 ][ i2 ] );
      }

      PMatSp[ i1 + 1 ].unshift( ( AI_Mat.PMat[ i1 ][ 0 ] || 0 ) + ( AI_Mat.PMat[ i1 ][ 1 ] || 0 ) );
    }

    temp = AI_Mat.MkD( "s", PMatSp, false ); for( var i = 0, i2 = c1, s = temp.split( "\r\n" ), temp = ""; i < c1 + 1; i++, i2-- )
    {
      temp += s[ i ] + "  sp1 -= s[" + i2 + "] * " + Math.pow( this.length - 2, i2 ) + "; sp2 -= s[" + i2 + "] * " + Math.pow( this.length - 1, i2 ) + ";\r\n";
    }
    
    code += temp + "\r\n"; temp = null;
    
    //Bottom spiral.

    for( var i = 0; i < this.length - 2; code += "  sp1 = ( sp2 - ( sp2 = sp1 ) );\r\n", i++ );
    
    //Create function.
    
    eval( code + "\r\n  g.unshift( s.shift() ); g.unshift(0); s.unshift(0);\r\n\r\n  return( new DSet( s, g, [ sp2, sp1 ] ) );\r\n}" );
    
    AI_Mat.debug += "<hr /><h2>Using Compiled function.</h2><hr />" + AI_Mat.SGeqSp[ this.length ].toString().html() + "";

    //Call function.

    t = AI_Mat.SGeqSp[ this.length ]( this );
  }
  
  AI_Mat.debug += "<hr /><h4>Note that you can copy the de-sequence function code if you wish to use it in any project.</h4><hr />";

  //Return Sequenced values.

  return ( t );
};

/***********************************************************************************
Decode all dimensional geo expansion sequences along set.
***********************************************************************************/

set.prototype.geo = function()
{
  //Adjust the matrix as necessary.

  AI_Mat.adjustSMat( this.length ); AI_Mat.adjustPMat( this.length );

  //Debug output.

  AI_Mat.debug += "<hr /><h2>Current Sequence Matrix.</h2><hr />"; AI_Mat.showMat( AI_Mat.PMat );
  AI_Mat.debug += "<hr /><h2>Current Alignment Matrix.</h2><hr />"; AI_Mat.showMat( AI_Mat.SMat );

  //Run Sequence function.

  var t = 0; if ( t = AI_Mat.Geq[ this.length ] ) { AI_Mat.debug += "<hr /><h2>Using Seqence function.</h2><hr />" + t.toString().html() + ""; t = t( this ); }

  //Else setup function for first time use.
  
  else
  {
    //Create function.

    eval( "AI_Mat.Geq[ " + this.length + " ] = function( s )\r\n{\r\n  var s = s.slice( 0 );\r\n\r\n\
	" + AI_Mat.MkS( "s", AI_Mat.PMat.slice( 0, this.length ), false ) + "\r\n  s.unshift( 0 );\r\n\r\n\
	" + AI_Mat.MkD( "s", AI_Mat.SMat.slice( 0, this.length + 1 ), false ) + "\r\n\
	  s[ 0 ] = 0; return( new DSet( [ 0 ], s, [ 0, 0 ] ) );\r\n}" );

    AI_Mat.debug += "<hr /><h2>Using Compiled function.</h2><hr />" + AI_Mat.Geq[ this.length ].toString().html() + "";

    //Call function.

    t = AI_Mat.Geq[ this.length ]( this );
  }

  AI_Mat.debug += "<hr /><h4>Note that you can copy the de-seqence function code if you wish to use it in any project.</h4><hr />";

  //Return Sequenced values.

  return ( t );
};

/***********************************************************************************
Decode all dimensional geo expansion sequences along set plus spiral.
***********************************************************************************/

set.prototype.geosp = function()
{
  //Adjust the matrix as necessary.

  AI_Mat.adjustSMat( this.length ); AI_Mat.adjustPMat( this.length );

  //Debug output.

  AI_Mat.debug += "<hr /><h2>Current Sequence Matrix.</h2><hr />"; AI_Mat.showMat( AI_Mat.SMat );
  AI_Mat.debug += "<hr /><h2>Current Alingment Matrix.</h2><hr />"; AI_Mat.showMat( AI_Mat.PMat );
  
  //Run Sequence function.

  var t = 0; if ( t = AI_Mat.GeqSp[ this.length ] ) { AI_Mat.debug += "<hr /><h2>Using Sequence function.</h2><hr />" + t.toString().html() + ""; t = t( this ); }

  //Else setup function for first time use.
  
  else
  {
    //Create function.
    
    var code = "AI_Mat.GeqSp[ " + this.length + " ] = function( s )\r\n{\r\n  var s = s.slice( 0 );\r\n\r\n";
    
    //Top spiral.
    
    for( var i = 0; i < this.length - 2; code += "  s[" + i + "] = s[" + ( i + 2 ) + "] - ( s[" + i + "] + s[" + ( i + 1 ) + "] );\r\n", i++ ); code += "\r\n";
    
    //Sequence matrix.
    
    code += AI_Mat.MkS( "s", AI_Mat.PMat.slice( 0, this.length - 2 ), false ) + "\r\n";
    
    //Align decode matrix.

    for (var i1 = 1, c = -1, b = 2, SMatSp = []; i1 < this.length - 1; c += b, b += 2, i1++)
    {
      SMatSp[i1 - 1] = [];

      for (var i2 = 0; i2 < AI_Mat.SMat[i1].length; SMatSp[i1 - 1][i2] = AI_Mat.SMat[i1][i2] * c, i2++);

      SMatSp[i1 - 1].shift();
    }

    var temp = AI_Mat.MkD( "s", SMatSp, false ); for( var i = 0, i2 = this.length - 3, s = temp.split( "\r\n" ), temp = ""; i < s.length - 1; i++, i2-- )
    {
      temp += s[ i ] + " s[" + ( this.length - 2 ) + "] -= s[" + i2 + "] * " + Math.pow( i2 + 1, this.length - 1 ) + "; s[" + ( this.length - 1 ) + "] -= s[" + i2 + "] * " + Math.pow( i2 + 1, this.length ) + ";\r\n";
    }
    
    code += temp + "\r\n"; temp = null;
    
    //Bottom spiral.
    
    code += "  var sp1 = s[" + ( this.length - 2 ) + "], sp2 = s[" + ( this.length - 1 ) + "];\r\n";
    for( var i = 0; i < this.length - 1; code += "  sp1 = ( sp2 - ( sp2 = sp1 ) );\r\n", i++ );
    code += "  s.unshift( 0 ); s.pop(); s.pop();\r\n";
    
    //Create function.
    
    eval( code + "\r\n  return( new DSet( [ 0 ], s, [ sp2, sp1 ] ) );\r\n}" );
    
    AI_Mat.debug += "<hr /><h2>Using Compiled function.</h2><hr />" + AI_Mat.GeqSp[ this.length ].toString().html() + "";

    //Call function.

    t = AI_Mat.GeqSp[ this.length ]( this );
  }
  
  AI_Mat.debug += "<hr /><h4>Note that you can copy the de-Sequence function code if you wish to use it in any project.</h4><hr />";

  //Return Sequenced values.

  return ( t );
};

/***********************************************************************************
Set to string.
***********************************************************************************/

set.prototype.toString = function( radix ) { for ( var i = 0, str = ""; i < this.length; str += "X" + i + " = " + this[ i++ ].toString( radix ) + "\r\n" ); return ( str ); }

/***********************************************************************************
DSet is the decoding of Seq, or Geo, or both. Takes two sets. The first set can be 0 if not used.
***********************************************************************************/

//Create two new sets that are in point format that are to be decoded.

function DSet( seq, geo, sp )
{
  this.seq = new set( seq || [ 0 ] ); this.geo = new set( geo || [ 0 ] ); this.sp = sp || [ 0, 0 ];

  //Is not filtered. Set already filtered if error correction is disabled.

  this.isFiltered = !AI_Mat.ErrCorrect;
}

/***********************************************************************************
Filter out error in geo and seq data.
***********************************************************************************/

DSet.prototype.filter = function()
{
  //EPSILON Filter.

  if ( !this.isFiltered )
  {
    this.isFiltered = true;

    //Average.

    for (var i = 0, l = []; i < this.seq.length; l[i] = ((Math.log(Math.abs(this.seq[i++])) / 0.6931471805599453) + 0.5) & -1);
    for (var i = 0; i < this.geo.length; l[l.length] = ((Math.log(Math.abs(this.geo[i++])) / 0.6931471805599453) + 0.5) & -1);
    for (var i = 0, avg = 0; i < l.length; avg += l[i++]); avg /= l.length;

    //Dynamic epsilon error correction if FL64 is loaded.

    if (Number.prototype.getFract)
    {
      var avg1 = 1 / Math.pow(2, 53 - avg);
      var avg2 = 1 / Math.pow(2, 26 - avg);

      for (var i = this.seq.length - 1, err = avg1; i > -1; err *= i-- )
      {
        this.seq[i] = this.seq[i].limit(err).getFract();
      }
      for (var i = this.geo.length - 1, err = avg1; i > -1; err *= i-- )
      {
        this.geo[i] = this.geo[i].limit(err).getFract();
      }

      this.sp[0] = this.sp[0].limit(avg2).getFract();
      this.sp[1] = this.sp[1].limit(avg2).getFract();
    }

    //Else remove terms outside average.

    else
    {
      for (i = 0; i < l.length; i++) { if (l[i] < avg && l[i] < 0) { if (i < this.seq.length) { this.seq[i] = 0; } else { this.geo[i - this.seq.length] = 0; } } }
    }
  }

  //For general use convert to best faction if FL64 is loaded.
  
  else if (Number.prototype.getFract)
  {
    this.seq = this.seq.getFract(); this.geo = this.geo.getFract(); this.sp = this.sp.getFract();
  }
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
      if ( init ) { code += d[ i ] < 0 ? "-" : "+"; f = d[ i ].toString( "*", true ); }
      else { f = d[ i ].toString( i < 1 ? "" : "*", i < 1 ); init = true; }

      if ( i > 1 ) { code += !sw ? "X^" + i : i + "^X"; } else if ( i === 1 ) { code += "X"; }

      code += f;
    }
  }

  return ( code.replace( / /g, "") );
}

/***********************************************************************************
Return an function of the solved data.
***********************************************************************************/

DSet.prototype.getFunc = function()
{
  //Convert sets to an function.

  this.filter();

  //If function had been initialized.

  var init = false, s = false, d = this.seq, sw = false;

  //Construct Sequence data into code.

  var code = "var f = function( x )\r\n{\r\n";

  //Spiral sequence.
  
  if( this.sp[0].valueOf() !== 0 || this.sp[1].valueOf() !== 0 )
  {
    code += "  for( var d = x < 0 ? -1 : 1, i = x * d, o = " + this.sp[1] + " * d, t = " + this.sp[0] + " * d; i > 0; o = ( t += o ) - o, i-- );\r\n\r\n"; init = true; s = true;
  }

  for ( var i = 0; i < d.length || !sw; i++ )
  {
    if ( i === d.length ) { sw = true; d = this.geo; i = 0; }

    if ( d[ i ].valueOf() !== 0 )
    {
      if ( !init ) { code += "  var o = "; init = true; } else { if ( d[ i ] < 0 ) { code += "  o -= "; } else { code += "  o += "; } }

      if ( i > 1 ) { code += String.toExp( "x", i, sw ) + d[ i ].toString( "*", s ); }
      
      else { code += ( !sw && i === 1 ) ? "x " + d[ 1 ].toString( "*", s ) : d[ i ].toString( "", s ); }

      code += ";\r\n"; s = init;
    }
  }
  
  eval( code += "  return( o );\r\n};" ); return ( f );
}

/***********************************************************************************
Convert set to HTML setting and color for each element.
***********************************************************************************/

set.prototype.fontcolor = function( c ) { return( ( this + "" ).replace( /= /g, "= <font color=\"" + c + "\">" ).replace( /\r\n/g, "</font><br />" ) ); }

/***********************************************************************************
HTML format function for browsers that do not support the formatting for debug output.
***********************************************************************************/

if( !String.prototype.fontcolor ) { String.prototype.fontcolor = function( c ) { return( "<font color=\"" + c + "\">" + this + "</font>" ); } }

/***********************************************************************************
Convert String to html.
***********************************************************************************/

String.prototype.html = function() { return( ( this.replace( / /g, "&nbsp;" ) ).replace( /\r\n/g, "<br />" ) ); }

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

for ( var i = 0, a = [ "reverse", "splice", "slice", "divP", "reduce", "valueOf", "getFract", "avgFract", "bits", "bitAnd", "bitOr", "bitXor", "bitNot", "bitRsh", "bitLsh", "toPattern", "err" ], c = ""; i < a.length; i++ )
{
  c += "set.prototype." + a[ i ] + " = function( arg ) { return( Array.prototype." + a[ i ] + " ? new set( Array.from( this )." + a[ i ] + "( arg ) ) : this ); };\r\n";
}
for ( var i = 0, a = [ "shift", "unshift", "push", "pop" ]; i < a.length; i++ )
{
  c += "set.prototype." + a[ i ] + " = Array.prototype." + a[ i ] + ";\r\n";
}

eval( c ); c = undefined; i = undefined; a = undefined;
