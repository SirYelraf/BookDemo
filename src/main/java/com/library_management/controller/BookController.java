package com.library_management.controller;

import com.library_management.model.Book;
import com.library_management.service.BookService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/books")
@CrossOrigin(origins = "*")
public class BookController {

    private final BookService bookService;

    public BookController(BookService bookService) {
        this.bookService = bookService;
    }

    // GET /api/books
    @GetMapping
    public ResponseEntity<List<Book>> getAllBooks() {
        List<Book> books = bookService.findAllBooks();
        return ResponseEntity.ok(books);
    }

    // GET /api/books/{id}
    @GetMapping("/{id}")
    public ResponseEntity<Book> getBookById(@PathVariable Long id) {
        Book book = bookService.findBookById(id);
        if (book == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(book);
    }

    // GET /api/books/search?name=...
    @GetMapping("/search")
    public ResponseEntity<?> searchBooks(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String author
    ) {
        if (name != null && author != null) {
            List<Book> books = bookService.FindAllBooksByAuthorAndBookName(author, name);
            return ResponseEntity.ok(books);
        } else if (name != null) {
            Book book = bookService.findBookByName(name);
            if (book == null) return ResponseEntity.notFound().build();
            return ResponseEntity.ok(book);
        } else if (author != null) {
            List<Book> books = bookService.findBooksByAuthor(author);
            return ResponseEntity.ok(books);
        } else {
            return ResponseEntity.badRequest().body("Provide at least one search param: name or author");
        }
    }

    // POST /api/books
    @PostMapping
    public ResponseEntity<Book> createBook(@RequestBody Book book) {
        Book created = bookService.createBook(book);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // PUT /api/books/{id}
    @PutMapping("/{id}")
    public ResponseEntity<Book> updateBook(@PathVariable Long id, @RequestBody Book book) {
        book.setId(id);
        Book updated = bookService.updateBook(book);
        if (updated == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(updated);
    }

    // DELETE /api/books/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBook(@PathVariable Long id) {
        bookService.deleteBookById(id);
        return ResponseEntity.noContent().build();
    }
}