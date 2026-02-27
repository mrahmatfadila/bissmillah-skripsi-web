# Entity Relationship Diagram (ERD)

Diagram ini merepresentasikan struktur database aktual berdasarkan `schema.prisma`.

## ERD (Mermaid Format)

```mermaid
erDiagram
    %% RELATIONSHIPS
    User ||--o{ Ticket : "creates (TicketCreator)"
    User ||--o{ Ticket : "assigned to (TicketAssignee)"
    User ||--o{ Comment : "writes"
    User ||--o{ KnowledgeBase : "authors"
    User ||--o{ Notification : "receives"

    Ticket ||--o{ Comment : "has comments"
    Ticket ||--o{ Notification : "triggers"
    Ticket }|--o| KnowledgeBase : "linked article"

    %% ENTITIES
    User {
        String id PK
        String nik "Unique"
        String name
        String email "Unique"
        String password
        Role role "Enum: SUPER_ADMIN, IT_SUPPORT..."
        String department
        String location
        String image
        DateTime createdAt
        DateTime updatedAt
    }

    Ticket {
        String id PK
        String ticketNumber "Unique"
        String title
        String description
        TicketStatus status "Enum: OPEN, IN_PROGRESS..."
        TicketPriority priority "Enum: LOW, MED, HIGH..."
        String category
        Float ahpScore
        String creatorId FK
        String assigneeId FK "Nullable"
        String kbArticleId FK "Nullable"
        String[] attachments "Array"
        DateTime createdAt
        DateTime updatedAt
    }

    Comment {
        String id PK
        String content
        String ticketId FK
        String authorId FK
        String[] attachments
        DateTime createdAt
    }

    KnowledgeBase {
        String id PK
        String title
        String content
        String category
        String tags
        String authorId FK
        DateTime createdAt
        DateTime updatedAt
    }

    Notification {
        String id PK
        String userId FK
        String ticketId FK "Nullable"
        String title
        String message
        String type
        Boolean read "Default: false"
        String link
        DateTime createdAt
    }

    AHPCriteria {
        String id PK
        String name
        Float weight
        DateTime createdAt
        DateTime updatedAt
    }

    RolePermission {
        String id PK
        Role role "Unique Enum"
        String permissions "JSON String"
        DateTime createdAt
        DateTime updatedAt
    }
```

## Enum Types

### Role
*   SUPER_ADMIN
*   IT_SUPPORT
*   MANAGER
*   SUPERVISOR
*   FINANCE
*   STAFF
*   SECURITY

### TicketStatus
*   OPEN
*   IN_PROGRESS
*   PENDING
*   RESOLVED
*   CLOSED
*   CANCELLED

### TicketPriority
*   LOW
*   MEDIUM
*   HIGH
*   CRITICAL
