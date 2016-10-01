#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>

int main_impl()
{
  puts("New monkey !");
  fflush(stdout);
  
  for (;;) {
    // syscall145
    const char ch = getchar();
    if (ch != '\n') {
      printf("Monkey input CHAR(syscall145): < %c >\n", ch);
      continue;
    }
    if (ch == EOF){
      break;
    }

    // syscall3
    char buffer_r[1024];
    const ssize_t bytes_read = read(fileno(stdin), buffer_r, sizeof(buffer_r));
    if (bytes_read > 0) {
      printf("Monkey input READ(syscall3): ");
      fwrite(buffer_r, sizeof(char), bytes_read, stdout);
    } else {
      printf("ERROR READ(syscall3) bytes_read: %d", bytes_read);
      break;
    }

    char *buffer_g = NULL;
    unsigned int len;
    // syscall145
    if (getline(&buffer_g, &len, stdin) != EOF) {
      printf("Monkey input LINE(syscall145): %s", buffer_g);
      fflush(stdout);
      free(buffer_g);   
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
