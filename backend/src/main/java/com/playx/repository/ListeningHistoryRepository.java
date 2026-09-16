package com.playx.repository;

import com.playx.model.ListeningHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

public interface ListeningHistoryRepository extends JpaRepository<ListeningHistory, String> {
    List<ListeningHistory> findByUserIdOrderByPlayedAtDesc(String userId);

    @Transactional
    void deleteBySongId(String songId);
}
