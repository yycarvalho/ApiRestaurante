/*
Navicat MySQL Data Transfer

Source Server         : Data
Source Server Version : 50505
Source Host           : localhost:3306
Source Database       : pedidos

Target Server Type    : MYSQL
Target Server Version : 50505
File Encoding         : 65001

Date: 2025-08-31 22:46:12
*/

SET FOREIGN_KEY_CHECKS=0;
-- ----------------------------
-- Table structure for `customer_messages`
-- ----------------------------
DROP TABLE IF EXISTS `customer_messages`;
CREATE TABLE `customer_messages` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `customer_id` bigint(20) NOT NULL,
  `direction` enum('inbound','outbound') NOT NULL,
  `channel` varchar(30) DEFAULT 'chat',
  `message` text NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `customer_id` (`customer_id`),
  CONSTRAINT `customer_messages_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Records of customer_messages
-- ----------------------------

-- ----------------------------
-- Table structure for `customers`
-- ----------------------------
DROP TABLE IF EXISTS `customers`;
CREATE TABLE `customers` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `phone` varchar(30) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_phone` (`phone`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=latin1;

-- ----------------------------
-- Records of customers
-- ----------------------------
INSERT INTO `customers` VALUES ('1', 'Ana Costa', '71991610046', '2025-08-29 23:15:58', '2025-08-30 00:31:35');

-- ----------------------------
-- Table structure for `order_chat_messages`
-- ----------------------------
DROP TABLE IF EXISTS `order_chat_messages`;
CREATE TABLE `order_chat_messages` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `order_id` varchar(32) NOT NULL,
  `sender` enum('customer','system','user') NOT NULL,
  `message` text NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`),
  CONSTRAINT `order_chat_messages_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=67 DEFAULT CHARSET=latin1;

-- ----------------------------
-- Records of order_chat_messages
-- ----------------------------
INSERT INTO `order_chat_messages` VALUES ('24', '202508300003', 'user', 'Administrador: Oi', '2025-08-30 19:42:53');
INSERT INTO `order_chat_messages` VALUES ('25', '202508300003', 'user', 'Administrador: Tudo bem?', '2025-08-30 19:43:08');
INSERT INTO `order_chat_messages` VALUES ('26', '202508300003', 'user', 'Administrador: Ois', '2025-08-30 19:52:57');
INSERT INTO `order_chat_messages` VALUES ('27', '202508300003', 'user', 'Administrador: asd', '2025-08-30 19:53:26');
INSERT INTO `order_chat_messages` VALUES ('28', '202508300003', 'user', 'Administrador: Oiaosdi Tdio bem?', '2025-08-30 19:56:40');
INSERT INTO `order_chat_messages` VALUES ('29', '202508300003', 'user', 'Administrador: Oi', '2025-08-30 19:59:54');
INSERT INTO `order_chat_messages` VALUES ('30', '202508300003', 'user', 'Administrador: Oi', '2025-08-30 20:04:44');
INSERT INTO `order_chat_messages` VALUES ('31', '202508300003', 'user', 'Administrador: Tudo bem?', '2025-08-30 20:05:09');
INSERT INTO `order_chat_messages` VALUES ('32', '202508300002', 'user', 'Administrador: oi', '2025-08-30 20:29:06');
INSERT INTO `order_chat_messages` VALUES ('33', '202508300003', 'user', 'Administrador: oi', '2025-08-30 20:38:00');
INSERT INTO `order_chat_messages` VALUES ('34', '202508300003', 'user', 'Administrador: oi', '2025-08-30 20:40:06');
INSERT INTO `order_chat_messages` VALUES ('35', '202508300001', 'user', 'Administrador: oi', '2025-08-30 20:42:24');
INSERT INTO `order_chat_messages` VALUES ('36', '202508300004', 'system', 'Status alterado de \'Em Atendimento\' para \'Finalizado\'', '2025-08-31 17:49:04');
INSERT INTO `order_chat_messages` VALUES ('37', '202508310005', 'system', 'Status alterado de \'Em Atendimento\' para \'Finalizado\'', '2025-08-31 17:50:56');
INSERT INTO `order_chat_messages` VALUES ('38', '202508310005', 'user', 'Administrador: oi', '2025-08-31 18:19:11');
INSERT INTO `order_chat_messages` VALUES ('39', '202508310006', 'system', 'Status alterado de \'Em Atendimento\' para \'Aguardando Pagamento\'', '2025-08-31 19:34:46');
INSERT INTO `order_chat_messages` VALUES ('40', '202508310006', 'system', 'Status alterado de \'Aguardando Pagamento\' para \'Em Atendimento\'', '2025-08-31 19:34:58');
INSERT INTO `order_chat_messages` VALUES ('41', '202508310006', 'system', 'Status alterado de \'Em Atendimento\' para \'Aguardando Pagamento\'', '2025-08-31 19:35:46');
INSERT INTO `order_chat_messages` VALUES ('42', '202508310006', 'system', 'Status alterado de \'Aguardando Pagamento\' para \'Em Atendimento\'', '2025-08-31 19:38:43');
INSERT INTO `order_chat_messages` VALUES ('43', '202508310006', 'system', 'Status alterado de \'Em Atendimento\' para \'Pedido Feito\'', '2025-08-31 19:38:50');
INSERT INTO `order_chat_messages` VALUES ('44', '202508310006', 'system', 'Status alterado de \'Pedido Feito\' para \'Em Atendimento\'', '2025-08-31 19:46:54');
INSERT INTO `order_chat_messages` VALUES ('45', '202508310006', 'user', 'Administrador: Oi', '2025-08-31 19:48:05');
INSERT INTO `order_chat_messages` VALUES ('46', '202508310006', 'user', 'Victor: oi', '2025-08-31 19:58:27');
INSERT INTO `order_chat_messages` VALUES ('47', '202508310006', 'user', 'Victor: oi', '2025-08-31 20:00:44');
INSERT INTO `order_chat_messages` VALUES ('48', '202508310006', 'user', 'Victor: Tudo bem?', '2025-08-31 20:01:00');
INSERT INTO `order_chat_messages` VALUES ('49', '202508310006', 'user', 'Victor: oi', '2025-08-31 20:01:26');
INSERT INTO `order_chat_messages` VALUES ('50', '202508310006', 'user', 'Administrador: oi', '2025-08-31 20:01:32');
INSERT INTO `order_chat_messages` VALUES ('51', '202508310006', 'user', 'Victor: oi', '2025-08-31 20:02:21');
INSERT INTO `order_chat_messages` VALUES ('52', '202508310006', 'user', 'Administrador: oi', '2025-08-31 20:02:28');
INSERT INTO `order_chat_messages` VALUES ('53', '202508310006', 'system', 'Status alterado de \'Em Atendimento\' para \'Aguardando Pagamento\'', '2025-08-31 20:02:42');
INSERT INTO `order_chat_messages` VALUES ('54', '202508310006', 'system', 'Status alterado de \'Aguardando Pagamento\' para \'Em Atendimento\'', '2025-08-31 20:04:31');
INSERT INTO `order_chat_messages` VALUES ('55', '202508310006', 'system', 'Status alterado de \'Em Atendimento\' para \'Pedido Feito\'', '2025-08-31 20:05:52');
INSERT INTO `order_chat_messages` VALUES ('56', '202508310006', 'system', 'Status alterado de \'Pedido Feito\' para \'Em Atendimento\'', '2025-08-31 20:06:01');
INSERT INTO `order_chat_messages` VALUES ('57', '202508310006', 'system', 'Status alterado de \'Em Atendimento\' para \'Em Preparo\'', '2025-08-31 20:07:13');
INSERT INTO `order_chat_messages` VALUES ('58', '202508310006', 'system', 'Status alterado de \'Em Preparo\' para \'Em Atendimento\'', '2025-08-31 20:07:21');
INSERT INTO `order_chat_messages` VALUES ('59', '202508310006', 'system', 'Status alterado de \'Em Atendimento\' para \'Aguardando Pagamento\'', '2025-08-31 20:07:34');
INSERT INTO `order_chat_messages` VALUES ('60', '202508310006', 'system', 'Status alterado de \'Aguardando Pagamento\' para \'Em Atendimento\'', '2025-08-31 20:08:21');
INSERT INTO `order_chat_messages` VALUES ('61', '202508310006', 'system', 'Status alterado de \'Em Atendimento\' para \'Aguardando Pagamento\'', '2025-08-31 23:27:21');
INSERT INTO `order_chat_messages` VALUES ('62', '202508310006', 'user', 'Administrador: oi', '2025-09-01 00:22:59');
INSERT INTO `order_chat_messages` VALUES ('63', '202508310006', 'user', 'Administrador: oi', '2025-09-01 01:31:13');
INSERT INTO `order_chat_messages` VALUES ('64', '202508310006', 'system', 'Status alterado de \'Aguardando Pagamento\' para \'Em Atendimento\'', '2025-09-01 01:32:56');
INSERT INTO `order_chat_messages` VALUES ('65', '202508310006', 'system', 'Status alterado de \'Em Atendimento\' para \'Finalizado\'', '2025-09-01 01:33:11');
INSERT INTO `order_chat_messages` VALUES ('66', '202508310006', 'system', 'Status alterado de \'Finalizado\' para \'Em Atendimento\'', '2025-09-01 01:34:58');

-- ----------------------------
-- Table structure for `order_items`
-- ----------------------------
DROP TABLE IF EXISTS `order_items`;
CREATE TABLE `order_items` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `order_id` varchar(32) NOT NULL,
  `product_id` bigint(20) DEFAULT NULL,
  `product_name` varchar(150) NOT NULL,
  `quantity` int(11) NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=latin1;

-- ----------------------------
-- Records of order_items
-- ----------------------------
INSERT INTO `order_items` VALUES ('19', '202508300001', '2', 'Frango Catupriy', '1', '39.90');
INSERT INTO `order_items` VALUES ('20', '202508300001', '3', 'Coca Cola', '1', '10.90');
INSERT INTO `order_items` VALUES ('21', '202508300002', '2', 'Frango Catupriy', '1', '39.90');
INSERT INTO `order_items` VALUES ('22', '202508300003', '2', 'Frango Catupriy', '1', '39.90');
INSERT INTO `order_items` VALUES ('23', '202508300004', '2', 'Frango Catupriy', '1', '39.90');
INSERT INTO `order_items` VALUES ('24', '202508310005', '2', 'Frango Catupriy', '1', '39.90');
INSERT INTO `order_items` VALUES ('25', '202508310006', '2', 'Frango Catupriy', '1', '39.90');

-- ----------------------------
-- Table structure for `orders`
-- ----------------------------
DROP TABLE IF EXISTS `orders`;
CREATE TABLE `orders` (
  `id` varchar(32) NOT NULL,
  `customer_id` bigint(20) DEFAULT NULL,
  `customer_name` varchar(150) NOT NULL,
  `customer_phone` varchar(30) NOT NULL,
  `address` varchar(255) DEFAULT NULL,
  `type` varchar(30) NOT NULL,
  `status` varchar(30) NOT NULL,
  `total` decimal(10,2) NOT NULL DEFAULT 0.00,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `customer_id` (`customer_id`),
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Records of orders
-- ----------------------------
INSERT INTO `orders` VALUES ('202508300001', null, 'Ana Costa', '71991610046', null, 'pickup', 'finalizado', '50.80', '2025-08-30 13:28:57', '2025-08-30 20:42:24');
INSERT INTO `orders` VALUES ('202508300002', null, 'Ana Costa', '71991610046', null, 'pickup', 'finalizado', '39.90', '2025-08-30 13:32:18', '2025-08-30 20:29:06');
INSERT INTO `orders` VALUES ('202508300003', null, 'Ana Costa', '71991610046', null, 'pickup', 'finalizado', '39.90', '2025-09-10 16:00:36', '2025-08-30 20:40:06');
INSERT INTO `orders` VALUES ('202508300004', null, 'Ana Costa', '71991610046', null, 'pickup', 'finalizado', '39.90', '2025-08-30 20:46:04', '2025-08-31 17:49:04');
INSERT INTO `orders` VALUES ('202508310005', null, 'Ana Costa', '71991610046', null, 'pickup', 'finalizado', '39.90', '2025-08-31 17:50:45', '2025-08-31 18:19:11');
INSERT INTO `orders` VALUES ('202508310006', null, 'Ana Costa', '71991610046', null, 'pickup', 'atendimento', '39.90', '2025-08-31 19:31:39', '2025-09-01 01:34:58');

-- ----------------------------
-- Table structure for `products`
-- ----------------------------
DROP TABLE IF EXISTS `products`;
CREATE TABLE `products` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `category` varchar(100) DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=latin1;

-- ----------------------------
-- Records of products
-- ----------------------------
INSERT INTO `products` VALUES ('2', 'Frango Catupriy', 'Teste', '39.90', 'lanches', '1', '2025-08-30 10:28:11', '2025-08-31 22:32:23');
INSERT INTO `products` VALUES ('3', 'Coca Cola', 'Coca Cola Original', '10.90', 'bebidas', '1', '2025-08-30 10:28:35', '2025-08-31 22:32:24');

-- ----------------------------
-- Table structure for `profiles`
-- ----------------------------
DROP TABLE IF EXISTS `profiles`;
CREATE TABLE `profiles` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `permissions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`permissions`)),
  `default_username` varchar(100) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=latin1;

-- ----------------------------
-- Records of profiles
-- ----------------------------
INSERT INTO `profiles` VALUES ('1', 'Administrador', null, 0x7B2276657244617368626F617264223A747275652C2276657250656469646F73223A747275652C22766572436172646170696F223A747275652C22637269617245646974617250726F6475746F223A747275652C226578636C75697250726F6475746F223A747275652C2264657361746976617250726F6475746F223A747275652C2276657243686174223A747275652C22656E7669617243686174223A747275652C22696D7072696D697250656469646F223A747275652C2261636573736172456E64657265636F223A747275652C2276697375616C697A617256616C6F7250656469646F223A747275652C2261636F6D70616E686172456E747265676173223A747275652C22676572617252656C61746F72696F73223A747275652C22766572506572666973223A747275652C22676572656E63696172506572666973223A747275652C22616C746572617253746174757350656469646F223A747275652C2273656C6563696F6E61725374617475734573706563696669636F223A747275652C2263726961725573756172696F73223A747275652C226564697461725573756172696F73223A747275652C226578636C7569725573756172696F73223A747275652C22766572436C69656E746573223A747275657D, null, '2025-08-28 22:14:20', '2025-08-31 21:50:14');

-- ----------------------------
-- Table structure for `system_logs`
-- ----------------------------
DROP TABLE IF EXISTS `system_logs`;
CREATE TABLE `system_logs` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `level` varchar(20) NOT NULL,
  `action` varchar(100) NOT NULL,
  `message` text DEFAULT NULL,
  `actor_username` varchar(100) DEFAULT NULL,
  `actor_user_id` bigint(20) DEFAULT NULL,
  `ip` varchar(64) DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT '',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_logs_level` (`level`),
  KEY `idx_logs_actor` (`actor_username`)
) ENGINE=InnoDB AUTO_INCREMENT=112 DEFAULT CHARSET=latin1;

-- ----------------------------
-- Records of system_logs
-- ----------------------------
INSERT INTO `system_logs` VALUES ('8', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-29 20:52:20');
INSERT INTO `system_logs` VALUES ('9', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-29 20:53:42');
INSERT INTO `system_logs` VALUES ('10', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-29 20:58:10');
INSERT INTO `system_logs` VALUES ('11', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-29 22:48:45');
INSERT INTO `system_logs` VALUES ('12', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-29 22:56:05');
INSERT INTO `system_logs` VALUES ('13', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-29 23:00:36');
INSERT INTO `system_logs` VALUES ('14', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-29 23:01:07');
INSERT INTO `system_logs` VALUES ('15', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-29 23:02:04');
INSERT INTO `system_logs` VALUES ('16', 'INFO', 'cliente_upsert', 'Cliente salvo', null, null, null, null, '2025-08-29 23:15:58');
INSERT INTO `system_logs` VALUES ('17', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-30 00:20:28');
INSERT INTO `system_logs` VALUES ('18', 'INFO', 'cliente_upsert', 'Cliente salvo', 'Administrador', '1', '0:0:0:0:0:0:0:1', 0x7B226E616D65223A22416E6120436F737461222C2270686F6E65223A223731393931363130303436227D, '2025-08-30 00:20:50');
INSERT INTO `system_logs` VALUES ('19', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-30 00:24:18');
INSERT INTO `system_logs` VALUES ('20', 'INFO', 'cliente_upsert', 'Cliente salvo', 'Administrador', '1', '/0:0:0:0:0:0:0:1', 0x7B226E616D65223A22416E6120436F737461222C2270686F6E65223A223731393931363130303436227D, '2025-08-30 00:24:39');
INSERT INTO `system_logs` VALUES ('21', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-30 00:29:13');
INSERT INTO `system_logs` VALUES ('22', 'INFO', 'cliente_upsert', 'Cliente salvo', 'Administrador', '1', '0:0:0:0:0:0:0:1', 0x7B226E616D65223A22416E6120436F737461222C2270686F6E65223A223731393931363130303436227D, '2025-08-30 00:30:11');
INSERT INTO `system_logs` VALUES ('23', 'INFO', 'cliente_upsert', 'Cliente salvo', 'Administrador', '1', '0:0:0:0:0:0:0:1', 0x7B226E616D65223A22416E6120436F737461222C2270686F6E65223A223731393931363130303436227D, '2025-08-30 00:31:35');
INSERT INTO `system_logs` VALUES ('24', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-30 00:56:57');
INSERT INTO `system_logs` VALUES ('25', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-30 01:09:52');
INSERT INTO `system_logs` VALUES ('26', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-30 01:10:51');
INSERT INTO `system_logs` VALUES ('27', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-30 02:01:11');
INSERT INTO `system_logs` VALUES ('28', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-30 02:04:16');
INSERT INTO `system_logs` VALUES ('29', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-30 02:05:15');
INSERT INTO `system_logs` VALUES ('30', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-30 02:09:02');
INSERT INTO `system_logs` VALUES ('31', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-30 02:10:57');
INSERT INTO `system_logs` VALUES ('32', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-30 02:11:23');
INSERT INTO `system_logs` VALUES ('33', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-30 02:12:33');
INSERT INTO `system_logs` VALUES ('34', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-30 02:19:13');
INSERT INTO `system_logs` VALUES ('35', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-30 02:24:18');
INSERT INTO `system_logs` VALUES ('36', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-30 02:25:27');
INSERT INTO `system_logs` VALUES ('37', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-30 02:37:21');
INSERT INTO `system_logs` VALUES ('38', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-30 02:46:01');
INSERT INTO `system_logs` VALUES ('39', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-30 02:48:17');
INSERT INTO `system_logs` VALUES ('40', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-30 02:48:56');
INSERT INTO `system_logs` VALUES ('41', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-30 02:51:13');
INSERT INTO `system_logs` VALUES ('42', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-30 02:56:22');
INSERT INTO `system_logs` VALUES ('43', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-30 02:59:11');
INSERT INTO `system_logs` VALUES ('44', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-30 03:00:44');
INSERT INTO `system_logs` VALUES ('45', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-30 03:14:51');
INSERT INTO `system_logs` VALUES ('46', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-30 03:18:07');
INSERT INTO `system_logs` VALUES ('47', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-30 03:21:31');
INSERT INTO `system_logs` VALUES ('48', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-30 03:22:58');
INSERT INTO `system_logs` VALUES ('49', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-30 03:29:33');
INSERT INTO `system_logs` VALUES ('50', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-30 03:35:45');
INSERT INTO `system_logs` VALUES ('51', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-30 03:37:44');
INSERT INTO `system_logs` VALUES ('52', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-30 03:45:21');
INSERT INTO `system_logs` VALUES ('53', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-30 03:47:37');
INSERT INTO `system_logs` VALUES ('54', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-30 03:50:26');
INSERT INTO `system_logs` VALUES ('55', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-30 03:51:46');
INSERT INTO `system_logs` VALUES ('56', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-30 03:52:03');
INSERT INTO `system_logs` VALUES ('57', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-30 03:52:21');
INSERT INTO `system_logs` VALUES ('58', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-30 03:53:46');
INSERT INTO `system_logs` VALUES ('59', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-30 03:54:33');
INSERT INTO `system_logs` VALUES ('60', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-30 03:55:10');
INSERT INTO `system_logs` VALUES ('61', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-30 03:55:46');
INSERT INTO `system_logs` VALUES ('62', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-30 03:56:27');
INSERT INTO `system_logs` VALUES ('63', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-30 03:58:32');
INSERT INTO `system_logs` VALUES ('64', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-30 04:01:47');
INSERT INTO `system_logs` VALUES ('65', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-30 04:05:24');
INSERT INTO `system_logs` VALUES ('66', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-30 09:51:24');
INSERT INTO `system_logs` VALUES ('67', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-30 09:56:39');
INSERT INTO `system_logs` VALUES ('68', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-30 10:25:37');
INSERT INTO `system_logs` VALUES ('69', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-30 10:25:54');
INSERT INTO `system_logs` VALUES ('70', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-30 10:26:12');
INSERT INTO `system_logs` VALUES ('71', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-30 10:27:46');
INSERT INTO `system_logs` VALUES ('72', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-30 10:49:21');
INSERT INTO `system_logs` VALUES ('73', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-30 11:00:53');
INSERT INTO `system_logs` VALUES ('74', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-30 11:02:46');
INSERT INTO `system_logs` VALUES ('75', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-30 11:05:21');
INSERT INTO `system_logs` VALUES ('76', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-30 11:08:25');
INSERT INTO `system_logs` VALUES ('77', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-30 11:09:25');
INSERT INTO `system_logs` VALUES ('78', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-30 11:17:26');
INSERT INTO `system_logs` VALUES ('79', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-30 12:18:05');
INSERT INTO `system_logs` VALUES ('80', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-30 12:23:33');
INSERT INTO `system_logs` VALUES ('81', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-30 12:25:06');
INSERT INTO `system_logs` VALUES ('82', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-30 12:26:31');
INSERT INTO `system_logs` VALUES ('83', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-30 15:38:39');
INSERT INTO `system_logs` VALUES ('84', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-30 15:39:27');
INSERT INTO `system_logs` VALUES ('85', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-30 15:44:47');
INSERT INTO `system_logs` VALUES ('86', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-30 15:45:53');
INSERT INTO `system_logs` VALUES ('87', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-30 15:48:25');
INSERT INTO `system_logs` VALUES ('88', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-30 16:02:17');
INSERT INTO `system_logs` VALUES ('89', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-30 16:29:56');
INSERT INTO `system_logs` VALUES ('90', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-30 16:30:56');
INSERT INTO `system_logs` VALUES ('91', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-30 16:33:07');
INSERT INTO `system_logs` VALUES ('92', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-30 16:41:30');
INSERT INTO `system_logs` VALUES ('93', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-30 16:42:33');
INSERT INTO `system_logs` VALUES ('94', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-30 17:24:44');
INSERT INTO `system_logs` VALUES ('95', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-31 14:48:06');
INSERT INTO `system_logs` VALUES ('96', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-31 14:56:33');
INSERT INTO `system_logs` VALUES ('97', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-31 15:04:01');
INSERT INTO `system_logs` VALUES ('98', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-31 15:52:49');
INSERT INTO `system_logs` VALUES ('99', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-31 16:03:21');
INSERT INTO `system_logs` VALUES ('100', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-31 16:04:49');
INSERT INTO `system_logs` VALUES ('101', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-31 16:06:47');
INSERT INTO `system_logs` VALUES ('102', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-31 16:08:15');
INSERT INTO `system_logs` VALUES ('103', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-31 16:09:13');
INSERT INTO `system_logs` VALUES ('104', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-31 16:10:03');
INSERT INTO `system_logs` VALUES ('105', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-31 16:13:59');
INSERT INTO `system_logs` VALUES ('106', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-31 16:30:26');
INSERT INTO `system_logs` VALUES ('107', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-31 16:33:46');
INSERT INTO `system_logs` VALUES ('108', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-31 16:57:59');
INSERT INTO `system_logs` VALUES ('109', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-31 16:59:39');
INSERT INTO `system_logs` VALUES ('110', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-31 17:06:18');
INSERT INTO `system_logs` VALUES ('111', 'INFO', 'server_start', 'Servidor iniciado', null, null, null, null, '2025-08-31 20:24:57');

-- ----------------------------
-- Table structure for `users`
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `username` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `full_name` varchar(150) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `profile_id` bigint(20) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  KEY `profile_id` (`profile_id`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`profile_id`) REFERENCES `profiles` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=latin1;

-- ----------------------------
-- Records of users
-- ----------------------------
INSERT INTO `users` VALUES ('1', 'admin', '123', 'Administrador', '', '1', '2025-08-28 22:14:20', '2025-08-31 22:39:17');
