%lex

%%
\s+		/* skipe whitespaces */
[0-9]+	return 'NUMBER';
"http"\:"//"[a-zA-Z0-9\-\.]+(\.[a-zA-Z]{2,3})?[\:\%\?\-\/\w]* return 'URL';
/*
[A-Za-z]\w* return 'TAG';
*/
"&&"		return '&&';
"||"		return '||';
"!"		return '!';
"("[a-zA-Z][\&\|\!\s\>\<\w\{\}\.\:\(\)]*")" return 'IQEXPRW';
[a-zA-Z][\&\|\!\>\<\w\{\}\.\:\(\)]* return 'IQEXPR';
"("		return '(';
")"		return ')';
"->"		return '->';
<<EOF>>	return 'EOF';
/lex

/* associations and precedence */
%right '->'
%left '&&'
%left '||'
%right '!'
%token IQEXPR NUMBER 

%% /* language grammar */
expressions 
	: e EOF
		{return $1;}
/*
	| decl EOF
		{return $1;}
*/
	;
/*
decl
	: TAG '=' URL ',' decl
		{$$ = ['url', [$1, $3, $5]];}
	| TAG '=' URL ';' e
		{$$ = ['url', [$1, $3, $5]];}
	;
*/
e
	: e '&&' e
		{$$ = ['&&', [$1, $3]];}
	| e '||' e
		{$$ = ['||', [$1, $3]];}
	| '!' e
		{$$ = ['!', [$2]];}
	| '(' e ')'
		{$$ = $2;}
	| '->' IQEXPRW
		{$$ = ['->', [Number.POSITIVE_INFINITY, String($2)]];}
	| '->' NUMBER IQEXPRW 
		{$$ = ['->', [Number($2), String($3)]];}
	| '->' IQEXPR
		{$$ = ['->', [Number.POSITIVE_INFINITY, String($2)]];}
	| '->' NUMBER IQEXPR
		{$$ = ['->', [Number($2), String($3)]];}
;
/*
	: TAG
		{$$ = ['tag', [String(yytext)]];}

	| TAG '.' TAG
		{$$ = ['tag', [$1, $3]];}
*/
/*
	| VARIABLE '.' TAG
		{$$ = ['variable', [$1.substr(1), $3]];}
	| VARIABLE 
		{$$ = ['variable', [$1.substr(1)]];}
*/
