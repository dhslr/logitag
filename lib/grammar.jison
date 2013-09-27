%lex

/* "$"[A-Za-z]\w* return 'VARIABLE'; */
%%
\s+		/* skipe whitespaces */
[0-9]+	return 'NUMBER';
"http"\:"//"[a-zA-Z0-9\-\.]+(\.[a-zA-Z]{2,3})?[\:\%\?\-\/\w]* return 'URL';
[A-Za-z]\w* return 'TAG';
"," return ',';
";" return ';';
"=" return '=';
"." return '.';
"$("[\&\|\<\>\w\s\.\-]+")" return 'IQEXPR';
"&&"		return '&&';
"||"		return '||';
"->"		return '->';
"!"		return '!';
"("		return '(';
")"		return ')';
<<EOF>>	return 'EOF';
/lex

/* associations and precedence */
%left '&&'
%left '||'
%right '!'
%right '->'
%token BOOLEAN TAG NUMBER 

%% /* language grammar */
expressions 
	: e EOF
		{return $1;}
	| decl EOF
		{return $1;}
	;
decl
	: TAG '=' URL ',' decl
		{$$ = ['url', [$1, $3, $5]];}
	| TAG '=' URL ';' e
		{$$ = ['url', [$1, $3, $5]];}
	;
e
	: TAG
		{$$ = ['tag', [String(yytext)]];}
	| IQEXPR
		{$$ = ['iqexpr', String(yytext).substr(2, String(yytext).length-3)];}

	| TAG '.' TAG
		{$$ = ['tag', [$1, $3]];}
/*
	| VARIABLE '.' TAG
		{$$ = ['variable', [$1.substr(1), $3]];}
	| VARIABLE 
		{$$ = ['variable', [$1.substr(1)]];}
*/

	| '(' e ')'
		{$$ = $2;}
	| e '&&' e
		{$$ = ['&&', [$1, $3]];}
	| e '||' e
		{$$ = ['||', [$1, $3]];}
	| '!' e
		{$$ = ['!', [$2]];}
	| '->' e
		{$$ = ['->', [Number.POSITIVE_INFINITY, $2]];}
	| '->' NUMBER e
		{$$ = ['->', [Number($2), $3]];}
;
