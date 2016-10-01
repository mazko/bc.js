#include <stdio.h>
#include <stdlib.h>

int main_impl()
{
  puts("New monkey !");
  fflush(stdout);
  
  for (;;) {
    // syscall145
    const char ch = getchar();
    if (ch != '\n') {
      printf("Monkey input CHAR: < %c >\n", ch);
      continue;
    }
    if (ch == EOF){
      break;
    }

    char *buffer = NULL;
    unsigned int len;
    // syscall3
    if (getline(&buffer, &len, stdin) != EOF) {
      printf("Monkey input LINE: %s", buffer);
      fflush(stdout);
      free(buffer);   
    } else {
      break;
    }
  }
  puts("End !");
  return 42;
}

int main()
{
  return main_impl();
}
