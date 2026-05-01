package com.library_management.service.impl;

import com.library_management.model.Book;
import com.library_management.repository.BookRepository;
import com.library_management.service.BookService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class BookServiceImpl implements BookService {

    private final BookRepository bookRepository;

    public BookServiceImpl(BookRepository bookRepository) {
        this.bookRepository = bookRepository;
    }

    @Override
    public List<Book> findAllBooks() {
        return bookRepository.findAll();
    }

    @Override
    public Book findBookById(Long id) {
        return bookRepository.findById(id).orElse(null);
    }

    @Override
    public Book findBookByName(String name) {
        return bookRepository.findByTitle(name).orElse(null);
    }

    @Override
    public List<Book> findBooksByAuthor(String author) {
        return bookRepository.findByAuthor(author);
    }

    @Override
    public List<Book> FindAllBooksByAuthorAndBookName(String author, String bookName) {
        return bookRepository.findByAuthorAndTitle(author, bookName);
    }

    @Override
    public Book createBook(Book book) {
        // Ensure this is treated as new; let JPA generate the ID
        book.setId(null);
        return bookRepository.save(book);
    }

    @Override
    public Book updateBook(Book book) {
        Long id = book.getId();
        if (id == null || !bookRepository.existsById(id)) {
            return null; // controller maps this to 404
        }
        return bookRepository.save(book);
    }

    @Override
    public void deleteBookById(Long id) {
        bookRepository.deleteById(id);
    }
}