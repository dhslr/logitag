%lex

%x CONTENT
%x KLAMMER
%x TEMPOPSTART
%x DECL

%%
\s+ 				{} /* skip whitespace */
"||"		 		{ return '||';}
"&&"		 		{ return '&&';}
"->"		 		{ this.begin('TEMPOPSTART'); temp = ""; return 'TEMPOP';}
"var"		 		{ this.begin('DECL'); }
([^-\&\|]+(-[^>\&\|])?)+	{ this.less(); this.begin('CONTENT'); temp = "";}

<DECL>\s+	   {}
<DECL>";"	   { this.begin('INITIAL'); return ';'; }
<DECL>"="	   { return '='; }
<DECL>","	   { return ','; }
<DECL>[^\=\,\;]+   { return 'VAL'; }

<TEMPOPSTART>\s+	{}
<TEMPOPSTART>[0-9]+	{ this.begin('CONTENT'); return 'INTEGER'; }
<TEMPOPSTART>[^0-9]	{ this.less(); this.begin('CONTENT'); } 

<CONTENT>\s+		{ temp += yytext; }
<CONTENT>"&&"		{ this.less(); yytext = temp; this.begin('INITIAL'); return 'CONTENT'; }
<CONTENT>"||"		{ this.less(); yytext = temp; this.begin('INITIAL'); return 'CONTENT'; }
<CONTENT>"("		{ this.begin('KLAMMER'); temp += yytext; count = 1;}
<CONTENT><<EOF>>	{ yytext = temp; return 'CONTENT'; } 
<CONTENT>[^()\&\|]+	{ temp += yytext; }

<KLAMMER>\s+		{ temp += yytext; }
<KLAMMER>"("		{ temp += yytext; count++; }
<KLAMMER>")"		{ temp += yytext; count--; if (count == 0) { yytext = temp; this.begin('INITIAL'); return 'CONTENT'; } }
<KLAMMER><<EOF>>	{ yytext = temp; return 'CONTENT'; }
<KLAMMER>[^()]		{ temp += yytext; }

/lex

%left '&&'
%left '||'
%right '!'
%right 'TEMPOP'
%token 'INTEGER' 'CONTENT'

%start programm

%%

programm
	: e
		{return $1;}
	| decl
		{return $1;}
;

decl
	: VAL '=' VAL ',' decl
		{$$ = ['url', [String($1), $3, $5]];}
	| VAL '=' VAL ';' e
		{$$ = ['url', [String($1), $3, $5]];}
;

e
  : e '&&' e 
	{ $$ = ['&&', [$1, $3]]; }
  | e '||' e
	{ $$ = ['||', [$1, $3]]; }
  | TEMPOP INTEGER CONTENT
	{ $$ = ['->', [Number($2), ['jsexpr', String($3)]]]; }
  | TEMPOP CONTENT
	{ $$ = ['->', [Number.POSITIVE_INFINITY, ['jsexpr', String($2)]]]; }
  | CONTENT
	{ $$ = ['jsexpr', String($1)]; }
;
